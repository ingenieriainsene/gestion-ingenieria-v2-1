package com.ingenieria.service;

import com.ingenieria.dto.SeguimientoDTO;
import com.ingenieria.dto.SeguimientoListResponse;
import com.ingenieria.model.Seguimiento;
import com.ingenieria.model.Tramite;
import com.ingenieria.model.Usuario;
import com.ingenieria.model.Proveedor;
import com.ingenieria.repository.SeguimientoRepository;
import com.ingenieria.repository.TramiteRepository;
import com.ingenieria.repository.UsuarioRepository;
import com.ingenieria.repository.ProveedorRepository;
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

    @Autowired private SeguimientoRepository seguimientoRepo;
    @Autowired private TramiteRepository tramiteRepo;
    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private ProveedorRepository proveedorRepo;

    public List<Seguimiento> findByTramite(Long idTramite) {
        return seguimientoRepo.findByTramite_IdTramiteOrderByFechaRegistroDesc(idTramite);
    }

    /**
     * Si el trámite no tiene hitos, crea el primero («Iniciar Actividad»). Luego devuelve la lista.
     * Replica acciones_tramites.php?accion=iniciar_seguimiento (auto-crear al entrar al detalle).
     */
    private static SeguimientoListResponse toListResponse(Seguimiento s) {
        return new SeguimientoListResponse(
                s.getIdSeguimiento(),
                s.getTramite() != null ? s.getTramite().getIdTramite() : null,
                s.getComentario(),
                s.getFechaSeguimiento(),
                s.getEsUrgente(),
                s.getEstado(),
                s.getFechaRegistro(),
                s.getUsuarioAsignado() != null ? s.getUsuarioAsignado().getNombreUsuario() : null,
                s.getCreador() != null ? s.getCreador().getNombreUsuario() : null,
                s.getProveedor() != null ? s.getProveedor().getIdProveedor() : null,
                s.getProveedor() != null ? s.getProveedor().getNombreComercial() : null);
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
        if (seguimientoRepo.countByTramite_IdTramite(idTramite) > 0) return;

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
        if (estado == null || estado.isBlank()) estado = "Pendiente";
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
            asignado = creador;
        } else if (dto.getIdUsuarioAsignado() != null) {
            Usuario u = usuarioRepo.findById(dto.getIdUsuarioAsignado())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            s.setUsuarioAsignado(u);
            asignado = u;
        } else {
            s.setUsuarioAsignado(creador);
            asignado = creador;
        }

        Seguimiento saved = seguimientoRepo.save(s);
        return new SeguimientoListResponse(
                saved.getIdSeguimiento(),
                dto.getIdTramite(),
                saved.getComentario(),
                saved.getFechaSeguimiento(),
                saved.getEsUrgente(),
                saved.getEstado(),
                saved.getFechaRegistro(),
                asignado != null ? asignado.getNombreUsuario() : null,
                creador != null ? creador.getNombreUsuario() : null,
                saved.getProveedor() != null ? saved.getProveedor().getIdProveedor() : null,
                saved.getProveedor() != null ? saved.getProveedor().getNombreComercial() : null);
    }

    @Transactional
    public void deleteById(Long idSeguimiento) {
        seguimientoRepo.deleteById(idSeguimiento);
    }
}
