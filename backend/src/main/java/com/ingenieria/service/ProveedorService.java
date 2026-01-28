package com.ingenieria.service;

import com.ingenieria.dto.ProveedorDTO;
import com.ingenieria.model.Proveedor;
import com.ingenieria.model.ProveedorContacto;
import com.ingenieria.model.ProveedorOficio;
import com.ingenieria.repository.ProveedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProveedorService {

    @Autowired
    private ProveedorRepository proveedorRepository;

    public List<Proveedor> findAll() {
        return proveedorRepository.findAll();
    }

    public Proveedor findById(Long id) {
        return proveedorRepository.findById(id).orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
    }

    @Transactional
    public Proveedor create(ProveedorDTO dto) {
        Proveedor p = new Proveedor();
        p.setNombreComercial(dto.getNombreComercial());
        p.setRazonSocial(dto.getRazonSocial());
        p.setCif(dto.getCif());
        p.setEsAutonomo(dto.getEsAutonomo());
        p.setDireccionFiscal(dto.getDireccionFiscal());

        // Oficios
        if (dto.getOficios() != null) {
            List<ProveedorOficio> oficios = dto.getOficios().stream().map(nombreOficio -> {
                ProveedorOficio po = new ProveedorOficio();
                po.setOficio(nombreOficio);
                po.setProveedor(p);
                return po;
            }).collect(Collectors.toList());
            p.setOficios(oficios);
        }

        // Contactos
        if (dto.getContactos() != null) {
            List<ProveedorContacto> contactos = dto.getContactos().stream().map(cDto -> {
                ProveedorContacto pc = new ProveedorContacto();
                pc.setNombre(cDto.getNombre());
                pc.setCargo(cDto.getCargo());
                pc.setTelefono(cDto.getTelefono());
                pc.setEmail(cDto.getEmail());
                pc.setProveedor(p);
                return pc;
            }).collect(Collectors.toList());
            p.setContactos(contactos);
        }

        return proveedorRepository.save(p);
    }
}
