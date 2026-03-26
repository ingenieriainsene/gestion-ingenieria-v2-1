package com.ingenieria.service;

import com.ingenieria.dto.SeguimientoDTO;
import com.ingenieria.dto.SeguimientoListResponse;
import com.ingenieria.model.Seguimiento;
import com.ingenieria.model.Tramite;
import com.ingenieria.model.Usuario;
import com.ingenieria.model.Proveedor;
import com.ingenieria.model.TecnicoInstalador;
import com.ingenieria.repository.SeguimientoRepository;
import com.ingenieria.repository.TramiteRepository;
import com.ingenieria.repository.UsuarioRepository;
import com.ingenieria.repository.ProveedorRepository;
import com.ingenieria.repository.TecnicoInstaladorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SeguimientoService {

    private static final String COMENTARIO_APERTURA = "Iniciar Actividad";

    @Autowired
    private SeguimientoRepository seguimientoRepo;
    @Autowired
    private TramiteRepository tramiteRepo;
    @Autowired
    private UsuarioRepository usuarioRepo;
    @Autowired
    private ProveedorRepository proveedorRepo;
    @Autowired
    private TecnicoInstaladorRepository tecnicoInstaladorRepo;

    public List<Seguimiento> findByTramite(Long idTramite) {
        return seguimientoRepo.findByTramite_IdTramiteOrderByFechaRegistroDesc(idTramite);
    }

    public List<Seguimiento> findAll() {
        return seguimientoRepo.findAll();
    }

    /**
     * Si el trámite no tiene hitos, crea el primero («Iniciar Actividad»). Luego
     * devuelve la lista.
     * Replica acciones_tramites.php?accion=iniciar_seguimiento (auto-crear al
     * entrar al detalle).
     */
    private static SeguimientoListResponse toListResponse(Seguimiento s) {
        SeguimientoListResponse res = new SeguimientoListResponse();
        res.setIdSeguimiento(s.getIdSeguimiento());
        res.setIdTramite(s.getTramite() != null ? s.getTramite().getIdTramite() : null);
        res.setComentario(s.getComentario());
        res.setFechaSeguimiento(s.getFechaSeguimiento());
        res.setEsUrgente(Boolean.TRUE.equals(s.getEsUrgente()));
        res.setEstado(s.getEstado());
        res.setFechaRegistro(s.getFechaRegistro());

        if (s.getUsuarioAsignado() != null) {
            res.setNombreAsignado(s.getUsuarioAsignado().getNombreUsuario());
            res.setIdUsuarioAsignado(s.getUsuarioAsignado().getIdUsuario());
        }
        if (s.getCreador() != null) {
            res.setNombreCreador(s.getCreador().getNombreUsuario());
            res.setIdCreador(s.getCreador().getIdUsuario());
        }
        if (s.getProveedor() != null) {
            res.setIdProveedor(s.getProveedor().getIdProveedor());
            res.setNombreProveedor(s.getProveedor().getNombreComercial());
        }

        res.setTipoTramite(s.getTramite() != null ? s.getTramite().getTipoTramite() : null);

        // Mapeo de listas múltiples
        if (s.getTecnicosInstaladores() != null) {
            res.setIdsTecnicosInstaladores(s.getTecnicosInstaladores().stream()
                    .map(TecnicoInstalador::getIdTecnicoInstalador)
                    .collect(Collectors.toList()));
            res.setNombresTecnicosInstaladores(s.getTecnicosInstaladores().stream()
                    .map(TecnicoInstalador::getNombre)
                    .collect(Collectors.toList()));
        }

        if (s.getUsuariosAsignados() != null) {
            res.setIdsUsuariosAsignados(s.getUsuariosAsignados().stream()
                    .map(Usuario::getIdUsuario)
                    .collect(Collectors.toList()));
            res.setNombresUsuariosAsignados(s.getUsuariosAsignados().stream()
                    .map(Usuario::getNombreUsuario)
                    .collect(Collectors.toList()));
        }

        return res;
    }

    @Transactional
    public List<SeguimientoListResponse> findDtosByTramite(Long idTramite) {
        ensurePrimerHito(idTramite);
        return seguimientoRepo.findByTramite_IdTramiteOrderByFechaRegistroDesc(idTramite).stream()
                .map(SeguimientoService::toListResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SeguimientoListResponse> findDtos(String estado) {
        List<Seguimiento> list;
        if (estado == null || estado.isBlank()) {
            list = seguimientoRepo.findAllByOrderByFechaRegistroDesc();
        } else {
            list = seguimientoRepo.findByEstadoIgnoreCaseOrderByFechaRegistroDesc(estado.trim());
        }
        return list.stream()
                .map(SeguimientoService::toListResponse)
                .collect(Collectors.toList());
    }

    private void ensurePrimerHito(Long idTramite) {
        List<Seguimiento> existentes = seguimientoRepo
                .findByTramite_IdTramiteOrderByFechaRegistroDesc(idTramite);

        if (existentes.isEmpty()) {
            // No hay historial: creamos el hito de apertura estándar
            Tramite t = tramiteRepo.findById(idTramite)
                    .orElseThrow(() -> new RuntimeException("Trámite no encontrado: " + idTramite));

            Usuario creador = null;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) {
                creador = usuarioRepo.findByNombreUsuario(auth.getName()).orElse(null);
            }
            if (creador == null) {
                creador = usuarioRepo.findAll().stream().findFirst()
                        .orElseThrow(() -> new RuntimeException("No hay usuarios en el sistema"));
            }

            Seguimiento s = new Seguimiento();
            s.setTramite(t);
            s.setComentario(COMENTARIO_APERTURA);
            s.setFechaSeguimiento(LocalDate.now());
            s.setEstado("Pendiente");
            s.setEsUrgente(false);
            s.setCreador(creador);
            s.setUsuarioAsignado(creador);
            seguimientoRepo.save(s);
            return;
        }

        // Saneador: si por algún motivo hay seguimientos "en blanco" recién creados,
        // nos aseguramos de que al menos uno tenga el comentario de apertura
        // y eliminamos duplicados completamente vacíos.
        List<Seguimiento> blancos = existentes.stream()
                .filter(s -> (s.getComentario() == null || s.getComentario().isBlank()))
                .toList();

        if (!blancos.isEmpty()) {
            Seguimiento principal = blancos.get(0);
            if (principal.getComentario() == null || principal.getComentario().isBlank()) {
                principal.setComentario(COMENTARIO_APERTURA);
            }
            if (principal.getEstado() == null || principal.getEstado().isBlank()) {
                principal.setEstado("Pendiente");
            }
            if (principal.getFechaSeguimiento() == null) {
                principal.setFechaSeguimiento(LocalDate.now());
            }
            seguimientoRepo.save(principal);

            if (blancos.size() > 1) {
                // Eliminamos duplicados completamente vacíos (solo en el caso especial de alta)
                blancos.stream().skip(1).forEach(seguimientoRepo::delete);
            }
        }
    }

    @Transactional
    public SeguimientoListResponse create(SeguimientoDTO dto) {
        Seguimiento s = new Seguimiento();

        Tramite t = tramiteRepo.findById(dto.getIdTramite())
                .orElseThrow(() -> new RuntimeException("Tramite no encontrado"));
        s.setTramite(t);

        s.setComentario(dto.getComentario());
        s.setFechaSeguimiento(dto.getFechaSeguimiento());
        s.setEsUrgente(Boolean.TRUE.equals(dto.getEsUrgente()));
        String estado = dto.getEstado();
        if (estado == null || estado.isBlank())
            estado = "Pendiente";
        s.setEstado(estado);

        Usuario creador = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            creador = usuarioRepo.findByNombreUsuario(auth.getName()).orElse(null);
        }
        if (creador == null) {
            creador = usuarioRepo.findAll().stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("No hay usuarios en el sistema"));
        }
        s.setCreador(creador);

        Usuario asignado;
        if (dto.getIdProveedor() != null) {
            Proveedor p = proveedorRepo.findById(dto.getIdProveedor())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
            s.setProveedor(p);
            s.setUsuarioAsignado(creador);
        } else if (dto.getIdUsuarioAsignado() != null) {
            Usuario u = usuarioRepo.findById(dto.getIdUsuarioAsignado())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            s.setUsuarioAsignado(u);
        } else {
            s.setUsuarioAsignado(creador);
        }

        // Handle multiple assignments if IDs are provided
        if (dto.getIdsTecnicosInstaladores() != null) {
            List<TecnicoInstalador> installers = tecnicoInstaladorRepo.findAllById(dto.getIdsTecnicosInstaladores());
            s.getTecnicosInstaladores().clear();
            s.getTecnicosInstaladores().addAll(installers);
        }

        if (dto.getIdsUsuariosAsignados() != null) {
            List<Usuario> technicals = usuarioRepo.findAllById(dto.getIdsUsuariosAsignados());
            s.getUsuariosAsignados().clear();
            s.getUsuariosAsignados().addAll(technicals);
        }

        Seguimiento saved = seguimientoRepo.save(s);
        return toListResponse(saved);
    }

    @Transactional
    public SeguimientoListResponse update(Long id, SeguimientoDTO dto) {
        Seguimiento s = seguimientoRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Seguimiento no encontrado: " + id));

        if (dto.getComentario() != null) {
            s.setComentario(dto.getComentario());
        }
        if (dto.getFechaSeguimiento() != null) {
            s.setFechaSeguimiento(dto.getFechaSeguimiento());
        }
        if (dto.getEsUrgente() != null) {
            s.setEsUrgente(Boolean.TRUE.equals(dto.getEsUrgente()));
        }
        if (dto.getEstado() != null && !dto.getEstado().isBlank()) {
            s.setEstado(dto.getEstado());
        }

        // Update relations if present
        if (dto.getIdProveedor() != null) {
            Proveedor p = proveedorRepo.findById(dto.getIdProveedor())
                    .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
            s.setProveedor(p);
            // If checking logic requires changing assigned user when provider changes
        } else {
            s.setProveedor(null);
        }

        if (dto.getIdUsuarioAsignado() != null) {
            Usuario u = usuarioRepo.findById(dto.getIdUsuarioAsignado())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            s.setUsuarioAsignado(u);
        }

        // Handle multiple assignments update
        if (dto.getIdsTecnicosInstaladores() != null) {
            List<TecnicoInstalador> installers = tecnicoInstaladorRepo.findAllById(dto.getIdsTecnicosInstaladores());
            s.getTecnicosInstaladores().clear();
            s.getTecnicosInstaladores().addAll(installers);
        }

        if (dto.getIdsUsuariosAsignados() != null) {
            List<Usuario> technicals = usuarioRepo.findAllById(dto.getIdsUsuariosAsignados());
            s.getUsuariosAsignados().clear();
            s.getUsuariosAsignados().addAll(technicals);
        }

        Seguimiento saved = seguimientoRepo.save(s);
        return toListResponse(saved);
    }

    @Transactional
    public void deleteById(Long idSeguimiento) {
        seguimientoRepo.deleteById(idSeguimiento);
    }
}
