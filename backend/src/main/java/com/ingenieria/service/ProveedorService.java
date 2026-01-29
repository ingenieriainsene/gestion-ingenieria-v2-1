package com.ingenieria.service;

import com.ingenieria.dto.ContactoDTO;
import com.ingenieria.dto.OficioDTO;
import com.ingenieria.dto.ProveedorCreateRequest;
import com.ingenieria.dto.ProveedorCreateResponse;
import com.ingenieria.dto.ProveedorDTO;
import com.ingenieria.dto.ProveedorDetailDTO;
import com.ingenieria.dto.ProveedorListDTO;
import com.ingenieria.model.Proveedor;
import com.ingenieria.model.ProveedorContacto;
import com.ingenieria.model.ProveedorOficio;
import com.ingenieria.repository.ProveedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProveedorService {

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Transactional(readOnly = true)
    public List<ProveedorListDTO> listarTodo() {
        return proveedorRepository.findAll(Sort.by("nombreComercial")).stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    private ProveedorListDTO convertirADTO(Proveedor p) {
        List<String> listaOficios = Collections.emptyList();
        if (p.getOficios() != null && !p.getOficios().isEmpty()) {
            listaOficios = p.getOficios().stream()
                    .map(ProveedorOficio::getOficio)
                    .filter(o -> o != null && !o.isBlank())
                    .collect(Collectors.toList());
        }
        int contactosCount = (p.getContactos() == null) ? 0 : p.getContactos().size();
        String telefono = null;
        String email = null;
        if (p.getContactos() != null && !p.getContactos().isEmpty()) {
            ProveedorContacto first = p.getContactos().get(0);
            telefono = first.getTelefono();
            email = first.getEmail();
        }
        String tipo = Boolean.TRUE.equals(p.getEsAutonomo()) ? "AUTÓNOMO" : "EMPRESA";
        return new ProveedorListDTO(
                p.getIdProveedor(),
                p.getNombreComercial() != null ? p.getNombreComercial() : "",
                p.getCif() != null ? p.getCif() : "",
                tipo,
                listaOficios,
                telefono,
                email,
                contactosCount
        );
    }

    public Proveedor findById(Long id) {
        return proveedorRepository.findById(id).orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
    }

    @Transactional(readOnly = true)
    public ProveedorDetailDTO getDetail(Long id) {
        Proveedor p = proveedorRepository.findById(id).orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        List<OficioDTO> oficios = new ArrayList<>();
        if (p.getOficios() != null) {
            p.getOficios().stream()
                    .filter(o -> o.getOficio() != null && !o.getOficio().isBlank())
                    .sorted(Comparator.comparing(ProveedorOficio::getOficio))
                    .forEach(o -> oficios.add(new OficioDTO(o.getIdOficio(), o.getOficio())));
        }
        List<ContactoDTO> contactos = new ArrayList<>();
        if (p.getContactos() != null) {
            p.getContactos().stream()
                    .sorted(Comparator.comparing(ProveedorContacto::getNombre, Comparator.nullsLast(Comparator.naturalOrder())))
                    .forEach(c -> {
                        ContactoDTO dto = new ContactoDTO();
                        dto.setId(c.getId());
                        dto.setNombre(c.getNombre());
                        dto.setCargo(c.getCargo());
                        dto.setTelefono(c.getTelefono());
                        dto.setEmail(c.getEmail());
                        contactos.add(dto);
                    });
        }
        return new ProveedorDetailDTO(
                p.getIdProveedor(),
                p.getNombreComercial(),
                p.getRazonSocial(),
                p.getCif(),
                p.getEsAutonomo(),
                p.getDireccionFiscal(),
                p.getFechaAlta(),
                oficios,
                contactos
        );
    }

    @Transactional
    public ContactoDTO addContact(Long idProveedor, ContactoDTO req) {
        if (req == null || req.getNombre() == null || req.getNombre().isBlank())
            throw new IllegalArgumentException("nombre es obligatorio.");
        Proveedor p = proveedorRepository.findById(idProveedor).orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        ProveedorContacto c = new ProveedorContacto();
        c.setProveedor(p);
        c.setNombre(req.getNombre().trim());
        c.setCargo(req.getCargo() != null && !req.getCargo().isBlank() ? req.getCargo().trim() : null);
        c.setTelefono(req.getTelefono() != null && !req.getTelefono().isBlank() ? req.getTelefono().trim() : null);
        c.setEmail(req.getEmail() != null && !req.getEmail().isBlank() ? req.getEmail().trim() : null);
        if (p.getContactos() == null) p.setContactos(new ArrayList<>());
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
        Proveedor p = proveedorRepository.findById(idProveedor).orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        if (p.getContactos() == null) return;
        boolean removed = p.getContactos().removeIf(c -> c.getId() != null && c.getId().equals(idContacto));
        if (removed) proveedorRepository.save(p);
    }

    @Transactional
    public ContactoDTO updateContact(Long idProveedor, Long idContacto, ContactoDTO req) {
        if (req == null || req.getNombre() == null || req.getNombre().isBlank())
            throw new IllegalArgumentException("nombre es obligatorio.");
        Proveedor p = proveedorRepository.findById(idProveedor).orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        if (p.getContactos() == null) throw new RuntimeException("Contacto no encontrado");
        ProveedorContacto c = p.getContactos().stream().filter(x -> idContacto.equals(x.getId())).findFirst().orElseThrow(() -> new RuntimeException("Contacto no encontrado"));
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
        Proveedor p = proveedorRepository.findById(idProveedor).orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        if (p.getOficios() != null) p.getOficios().clear();
        else p.setOficios(new ArrayList<>());
        if (oficios != null) {
            for (String s : oficios) {
                if (s != null && !s.isBlank()) {
                    ProveedorOficio o = new ProveedorOficio();
                    o.setProveedor(p);
                    o.setOficio(s.trim());
                    p.getOficios().add(o);
                }
            }
        }
        proveedorRepository.save(p);
    }

    @Transactional
    public ProveedorCreateResponse create(ProveedorCreateRequest req) {
        if (req == null) throw new IllegalArgumentException("Cuerpo de la petición inválido.");
        if (req.getNombreComercial() == null || req.getNombreComercial().isBlank())
            throw new IllegalArgumentException("nombreComercial es obligatorio.");
        if (req.getCif() == null || req.getCif().isBlank())
            throw new IllegalArgumentException("cif es obligatorio.");

        Proveedor p = new Proveedor();
        p.setNombreComercial(req.getNombreComercial().trim());
        p.setCif(req.getCif().trim());
        p.setEsAutonomo(req.getEsAutonomo() != null && req.getEsAutonomo());
        p.setRazonSocial(req.getRazonSocial() != null && !req.getRazonSocial().isBlank() ? req.getRazonSocial().trim() : null);
        p.setDireccionFiscal(req.getDireccionFiscal() != null && !req.getDireccionFiscal().isBlank() ? req.getDireccionFiscal().trim() : null);

        if (req.getOficios() != null && !req.getOficios().isEmpty()) {
            List<ProveedorOficio> oficios = req.getOficios().stream()
                    .filter(n -> n != null && !n.isBlank())
                    .map(nombreOficio -> {
                        ProveedorOficio po = new ProveedorOficio();
                        po.setOficio(nombreOficio.trim());
                        po.setProveedor(p);
                        return po;
                    }).collect(Collectors.toList());
            if (!oficios.isEmpty()) p.setOficios(oficios);
        }

        if (req.getContactos() != null && !req.getContactos().isEmpty()) {
            List<ProveedorContacto> contactos = req.getContactos().stream()
                    .filter(c -> c != null && c.getNombre() != null && !c.getNombre().isBlank())
                    .map(cDto -> {
                        ProveedorContacto pc = new ProveedorContacto();
                        pc.setNombre(cDto.getNombre().trim());
                        pc.setCargo(cDto.getCargo() != null && !cDto.getCargo().isBlank() ? cDto.getCargo().trim() : null);
                        pc.setTelefono(cDto.getTelefono() != null && !cDto.getTelefono().isBlank() ? cDto.getTelefono().trim() : null);
                        pc.setEmail(cDto.getEmail() != null && !cDto.getEmail().isBlank() ? cDto.getEmail().trim() : null);
                        pc.setProveedor(p);
                        return pc;
                    }).collect(Collectors.toList());
            if (!contactos.isEmpty()) p.setContactos(contactos);
        }

        Proveedor saved = proveedorRepository.save(p);
        return new ProveedorCreateResponse(saved.getIdProveedor());
    }

    @Transactional
    public void update(Long id, ProveedorDTO dto) {
        Proveedor p = proveedorRepository.findById(id).orElseThrow(() -> new RuntimeException("Proveedor no encontrado: " + id));
        if (dto.getNombreComercial() != null) p.setNombreComercial(dto.getNombreComercial());
        if (dto.getRazonSocial() != null) p.setRazonSocial(dto.getRazonSocial());
        if (dto.getCif() != null) p.setCif(dto.getCif());
        if (dto.getDireccionFiscal() != null) p.setDireccionFiscal(dto.getDireccionFiscal());
        if (dto.getEsAutonomo() != null) p.setEsAutonomo(dto.getEsAutonomo());
        proveedorRepository.save(p);
    }

    @Transactional
    public void delete(Long id) {
        proveedorRepository.deleteById(id);
    }
}
