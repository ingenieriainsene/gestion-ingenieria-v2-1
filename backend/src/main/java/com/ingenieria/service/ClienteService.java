package com.ingenieria.service;

import com.ingenieria.model.Cliente;
import com.ingenieria.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ClienteService {
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private com.ingenieria.repository.ArchivoClienteRepository archivoRepository;
    @org.springframework.beans.factory.annotation.Value("${app.file.upload-dir:uploads}")
    private String uploadDir;

    public List<Cliente> findAll() {
        return clienteRepository.findAll();
    }

    // ... finds ...

    public com.ingenieria.dto.ArchivoClienteDTO subirArchivo(Long clienteId,
            org.springframework.web.multipart.MultipartFile file, String username) throws java.io.IOException {
        Cliente cliente = findById(clienteId);

        // Crear directorio si no existe (uploads/clientes/{id})
        java.nio.file.Path root = java.nio.file.Paths.get(uploadDir).toAbsolutePath();
        java.nio.file.Path clienteDir = root.resolve("clientes").resolve(String.valueOf(clienteId));
        if (!java.nio.file.Files.exists(clienteDir)) {
            java.nio.file.Files.createDirectories(clienteDir);
        }

        // Guardar archivo físico
        String originalDetails = file.getOriginalFilename();
        String safeName = System.currentTimeMillis() + "_"
                + (originalDetails != null ? originalDetails.replaceAll("[^a-zA-Z0-9.-]", "_") : "unnamed");
        java.nio.file.Path target = clienteDir.resolve(safeName);
        java.nio.file.Files.copy(file.getInputStream(), target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

        // Guardar metadatos en BD
        com.ingenieria.model.ArchivoCliente archivo = new com.ingenieria.model.ArchivoCliente();
        archivo.setCliente(cliente);
        archivo.setNombreVisible(originalDetails);
        archivo.setNombreFisico(safeName);
        archivo.setTipoArchivo(file.getContentType());
        archivo.setCategoria("Documentacion"); // Por defecto
        archivo.setUsuarioSubida(username);

        archivo = archivoRepository.save(archivo);
        return toDto(archivo);
    }

    public List<com.ingenieria.dto.ArchivoClienteDTO> getArchivos(Long clienteId) {
        return archivoRepository.findByCliente_IdCliente(clienteId).stream()
                .map(this::toDto)
                .collect(java.util.stream.Collectors.toList());
    }

    public void deleteArchivo(Long archivoId) {
        archivoRepository.findById(archivoId).ifPresent(a -> {
            try {
                java.nio.file.Path file = java.nio.file.Paths.get(uploadDir)
                        .resolve("clientes")
                        .resolve(String.valueOf(a.getCliente().getIdCliente()))
                        .resolve(a.getNombreFisico());
                java.nio.file.Files.deleteIfExists(file);
            } catch (java.io.IOException e) {
                // Log failed delete
            }
            archivoRepository.delete(a);
        });
    }

    private com.ingenieria.dto.ArchivoClienteDTO toDto(com.ingenieria.model.ArchivoCliente a) {
        com.ingenieria.dto.ArchivoClienteDTO dto = new com.ingenieria.dto.ArchivoClienteDTO();
        dto.setIdArchivo(a.getIdArchivo());
        dto.setClienteId(a.getCliente().getIdCliente());
        dto.setNombreVisible(a.getNombreVisible());
        dto.setTipoArchivo(a.getTipoArchivo());
        dto.setFechaSubida(a.getFechaSubida());
        dto.setUsuarioSubida(a.getUsuarioSubida());

        // URL relativa para descarga: /api/clientes/{id}/archivos/{fileId}/download
        // Ojo: En un sistema real esto iría a un controller específico de resources.
        // Aquí usaremos la API para descargar.
        dto.setUrl("api/clientes/archivos/" + a.getIdArchivo() + "/download");
        return dto;
    }

    public com.ingenieria.model.ArchivoCliente getArchivoEntity(Long id) {
        return archivoRepository.findById(id).orElseThrow(() -> new RuntimeException("Archivo no encontrado"));
    }

    // ... rest of file

    public Cliente findById(Long id) {
        return clienteRepository.findById(id).orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
    }

    public Cliente save(Cliente cliente) {
        // Validar DNI único
        if (cliente.getDni() != null) {
            clienteRepository.findByDni(cliente.getDni()).ifPresent(existente -> {
                if (cliente.getIdCliente() == null || !existente.getIdCliente().equals(cliente.getIdCliente())) {
                    throw new IllegalArgumentException(
                            "Ya existe un cliente registrado con el DNI: " + cliente.getDni());
                }
            });
        }

        // Asegurar relación bidireccional de teléfonos
        if (cliente.getTelefonos() != null) {
            cliente.getTelefonos().forEach(t -> t.setCliente(cliente));
        }

        return clienteRepository.save(cliente);
    }

    public java.util.Optional<Cliente> findByDni(String dni) {
        return clienteRepository.findByDni(dni);
    }

    public void delete(Long id) {
        clienteRepository.deleteById(id);
    }

    public List<Cliente> search(String term) {
        String like = "%" + term + "%";
        return clienteRepository.findByNombreContainingOrApellido1ContainingOrDniContaining(like, like, like);
    }
}
