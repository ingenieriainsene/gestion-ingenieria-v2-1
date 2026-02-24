package com.ingenieria.service;

import com.ingenieria.dto.*;
import com.ingenieria.model.*;
import com.ingenieria.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ProveedorService {

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Autowired
    private AlbaranProveedorRepository albaranRepository;

    @Autowired
    private FacturaProveedorRepository facturaRepository;

    @Autowired
    private SeguimientoRepository seguimientoRepository;

    public List<ProveedorListDTO> listarTodo() {
        return proveedorRepository.findAll(Sort.by(Sort.Direction.ASC, "nombreComercial"))
                .stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    private ProveedorListDTO convertirADTO(Proveedor p) {
        String tipo = (p.getEsAutonomo() != null && p.getEsAutonomo()) ? "AUTÓNOMO" : "EMPRESA";
        List<String> listaOficios = (p.getOficios() != null)
                ? p.getOficios().stream().map(ProveedorOficio::getOficio).collect(Collectors.toList())
                : new ArrayList<>();

        String telefono = "—";
        String email = "—";
        if (p.getContactos() != null && !p.getContactos().isEmpty()) {
            ProveedorContacto pc = p.getContactos().get(0);
            telefono = pc.getTelefono() != null ? pc.getTelefono() : "—";
            email = pc.getEmail() != null ? pc.getEmail() : "—";
        }

        int contactosCount = (p.getContactos() != null) ? p.getContactos().size() : 0;

        return new ProveedorListDTO(
                p.getIdProveedor(),
                p.getNombreComercial() != null ? p.getNombreComercial() : "",
                p.getCif() != null ? p.getCif() : "",
                tipo,
                listaOficios,
                telefono,
                email,
                contactosCount);
    }

    public Proveedor findById(Long id) {
        return proveedorRepository.findById(id).orElse(null);
    }

    public ProveedorDetailDTO getDetail(Long id) {
        Proveedor p = proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));

        List<ContactoDTO> contactos = (p.getContactos() != null)
                ? p.getContactos().stream().map(c -> {
                    ContactoDTO dto = new ContactoDTO();
                    dto.setId(c.getId());
                    dto.setNombre(c.getNombre());
                    dto.setCargo(c.getCargo());
                    dto.setTelefono(c.getTelefono());
                    dto.setEmail(c.getEmail());
                    return dto;
                }).collect(Collectors.toList())
                : new ArrayList<>();

        List<OficioDTO> oficios = (p.getOficios() != null)
                ? p.getOficios().stream().map(o -> new OficioDTO(o.getIdOficio(), o.getOficio()))
                        .collect(Collectors.toList())
                : new ArrayList<>();

        // Nuevas pestañas (Albaranes y Facturas)
        List<AlbaranProveedorDTO> albaranes = albaranRepository.findByProveedor_IdProveedor(id).stream()
                .map(a -> {
                    String numeroTramite = "N/A";
                    if (a.getTramite() != null) {
                        numeroTramite = "#" + a.getTramite().getIdTramite();
                    }
                    return new AlbaranProveedorDTO(
                            a.getIdAlbaran(),
                            a.getNumeroAlbaran(),
                            a.getFecha(),
                            a.getImporte(),
                            a.getTramite() != null ? a.getTramite().getIdTramite() : null,
                            numeroTramite,
                            a.getNotas());
                })
                .collect(Collectors.toList());

        List<FacturaProveedorDTO> facturas = facturaRepository.findByProveedor_IdProveedor(id).stream()
                .map(f -> {
                    String numeroTramite = "N/A";
                    if (f.getTramite() != null) {
                        numeroTramite = "#" + f.getTramite().getIdTramite();
                    }
                    return new FacturaProveedorDTO(
                            f.getIdFactura(),
                            f.getNumeroFactura(),
                            f.getFecha(),
                            f.getImporte(),
                            f.getEstado(),
                            f.getTramite() != null ? f.getTramite().getIdTramite() : null,
                            numeroTramite,
                            f.getNotas());
                })
                .collect(Collectors.toList());

        List<TrabajoAsociadoDTO> trabajos = seguimientoRepository.findByProveedor_IdProveedor(id).stream()
                .map(s -> s.getTramite())
                .filter(Objects::nonNull)
                .distinct()
                .map(t -> {
                    Contrato c = t.getContrato();
                    String cliente = "N/A";
                    String local = "N/A";
                    if (c != null) {
                        if (c.getCliente() != null) {
                            cliente = c.getCliente().getNombre() + " " + c.getCliente().getApellido1();
                        }
                        if (c.getLocal() != null) {
                            local = c.getLocal().getDireccionCompleta();
                        }
                    }
                    return new TrabajoAsociadoDTO(
                            t.getIdTramite(),
                            t.getTipoTramite(),
                            cliente,
                            local,
                            t.getFechaSeguimiento(),
                            t.getEstado());
                }).collect(Collectors.toList());

        return new ProveedorDetailDTO(
                p.getIdProveedor(),
                p.getNombreComercial(),
                p.getRazonSocial(),
                p.getCif(),
                p.getEsAutonomo() != null && p.getEsAutonomo(),
                p.getDireccionFiscal(),
                p.getFechaAlta(),
                oficios,
                contactos,
                albaranes,
                facturas,
                trabajos);
    }

    @Transactional
    public ContactoDTO addContact(Long idProveedor, ContactoDTO req) {
        if (req == null || req.getNombre() == null || req.getNombre().isBlank())
            throw new IllegalArgumentException("nombre es obligatorio.");
        Proveedor p = proveedorRepository.findById(idProveedor)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        if (p.getContactos() == null)
            p.setContactos(new ArrayList<>());
        ProveedorContacto c = new ProveedorContacto();
        c.setNombre(req.getNombre().trim());
        c.setCargo(req.getCargo() != null && !req.getCargo().isBlank() ? req.getCargo().trim() : null);
        c.setTelefono(req.getTelefono() != null && !req.getTelefono().isBlank() ? req.getTelefono().trim() : null);
        c.setEmail(req.getEmail() != null && !req.getEmail().isBlank() ? req.getEmail().trim() : null);
        c.setProveedor(p);
        p.getContactos().add(c);
        proveedorRepository.save(p);
        ContactoDTO out = new ContactoDTO();
        out.setId(c.getId());
        out.setNombre(c.getNombre());
        out.setCargo(c.getCargo());
        out.setTelefono(c.getTelefono());
        out.setEmail(c.getEmail());
        return out;
    }

    @Transactional
    public void deleteContact(Long idProveedor, Long idContacto) {
        Proveedor p = proveedorRepository.findById(idProveedor)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        if (p.getContactos() == null)
            return;
        boolean removed = p.getContactos().removeIf(c -> c.getId() != null && c.getId().equals(idContacto));
        if (removed)
            proveedorRepository.save(p);
    }

    @Transactional
    public ContactoDTO updateContact(Long idProveedor, Long idContacto, ContactoDTO req) {
        if (req == null || req.getNombre() == null || req.getNombre().isBlank())
            throw new IllegalArgumentException("nombre es obligatorio.");
        Proveedor p = proveedorRepository.findById(idProveedor)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        if (p.getContactos() == null)
            throw new RuntimeException("Contacto no encontrado");
        ProveedorContacto c = p.getContactos().stream().filter(x -> idContacto.equals(x.getId())).findFirst()
                .orElseThrow(() -> new RuntimeException("Contacto no encontrado"));
        c.setNombre(req.getNombre().trim());
        c.setCargo(req.getCargo() != null && !req.getCargo().isBlank() ? req.getCargo().trim() : null);
        c.setTelefono(req.getTelefono() != null && !req.getTelefono().isBlank() ? req.getTelefono().trim() : null);
        c.setEmail(req.getEmail() != null && !req.getEmail().isBlank() ? req.getEmail().trim() : null);
        proveedorRepository.save(p);
        ContactoDTO out = new ContactoDTO();
        out.setId(c.getId());
        out.setNombre(c.getNombre());
        out.setCargo(c.getCargo());
        out.setTelefono(c.getTelefono());
        out.setEmail(c.getEmail());
        return out;
    }

    @Transactional
    public void updateOficios(Long idProveedor, List<String> oficios) {
        Proveedor p = proveedorRepository.findById(idProveedor)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        if (p.getOficios() == null)
            p.setOficios(new ArrayList<>());
        p.getOficios().clear();
        if (oficios != null) {
            for (String s : oficios) {
                if (s != null && !s.isBlank()) {
                    ProveedorOficio po = new ProveedorOficio();
                    po.setOficio(s.trim());
                    po.setProveedor(p);
                    p.getOficios().add(po);
                }
            }
        }
        proveedorRepository.save(p);
    }

    @Transactional
    public ProveedorCreateResponse create(ProveedorCreateRequest req) {
        if (req == null)
            throw new IllegalArgumentException("Cuerpo de la petición inválido.");
        if (req.getNombreComercial() == null || req.getNombreComercial().isBlank())
            throw new IllegalArgumentException("nombreComercial es obligatorio.");
        if (req.getCif() == null || req.getCif().isBlank())
            throw new IllegalArgumentException("cif es obligatorio.");

        Proveedor p = new Proveedor();
        p.setNombreComercial(req.getNombreComercial().trim());
        p.setCif(req.getCif().trim());
        p.setEsAutonomo(req.getEsAutonomo() != null && req.getEsAutonomo());
        p.setRazonSocial(
                req.getRazonSocial() != null && !req.getRazonSocial().isBlank() ? req.getRazonSocial().trim() : null);
        p.setDireccionFiscal(req.getDireccionFiscal() != null && !req.getDireccionFiscal().isBlank()
                ? req.getDireccionFiscal().trim()
                : null);

        if (req.getOficios() != null && !req.getOficios().isEmpty()) {
            List<ProveedorOficio> oficios = req.getOficios().stream()
                    .filter(n -> n != null && !n.isBlank())
                    .map(nombreOficio -> {
                        ProveedorOficio po = new ProveedorOficio();
                        po.setOficio(nombreOficio.trim());
                        po.setProveedor(p);
                        return po;
                    }).collect(Collectors.toList());
            if (!oficios.isEmpty())
                p.setOficios(oficios);
        }

        if (req.getContactos() != null && !req.getContactos().isEmpty()) {
            List<ProveedorContacto> contactos = req.getContactos().stream()
                    .filter(c -> c != null && c.getNombre() != null && !c.getNombre().isBlank())
                    .map(cDto -> {
                        ProveedorContacto pc = new ProveedorContacto();
                        pc.setNombre(cDto.getNombre().trim());
                        pc.setCargo(
                                cDto.getCargo() != null && !cDto.getCargo().isBlank() ? cDto.getCargo().trim() : null);
                        pc.setTelefono(
                                cDto.getTelefono() != null && !cDto.getTelefono().isBlank() ? cDto.getTelefono().trim()
                                        : null);
                        pc.setEmail(
                                cDto.getEmail() != null && !cDto.getEmail().isBlank() ? cDto.getEmail().trim() : null);
                        pc.setProveedor(p);
                        return pc;
                    }).collect(Collectors.toList());
            if (!contactos.isEmpty())
                p.setContactos(contactos);
        }

        Proveedor saved = proveedorRepository.save(p);
        return new ProveedorCreateResponse(saved.getIdProveedor());
    }

    @Transactional
    public void update(Long id, ProveedorDTO dto) {
        Proveedor p = proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        p.setNombreComercial(dto.getNombreComercial().trim());
        p.setCif(dto.getCif().trim());
        p.setRazonSocial(dto.getRazonSocial() != null ? dto.getRazonSocial().trim() : null);
        p.setDireccionFiscal(dto.getDireccionFiscal() != null ? dto.getDireccionFiscal().trim() : null);
        p.setEsAutonomo(dto.getEsAutonomo());
        proveedorRepository.save(p);
    }

    @Transactional
    public void delete(Long id) {
        proveedorRepository.deleteById(id);
    }
}
