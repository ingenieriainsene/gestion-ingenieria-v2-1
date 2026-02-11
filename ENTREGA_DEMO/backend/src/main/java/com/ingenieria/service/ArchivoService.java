package com.ingenieria.service;

import com.ingenieria.model.*;
import com.ingenieria.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
public class ArchivoService {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    @Autowired
    private ArchivoClienteRepository archivoClienteRepository;

    @Autowired
    private ArchivoTramiteRepository archivoTramiteRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private TramiteRepository tramiteRepository;

    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("No se pudo crear el directorio de subida de archivos.", ex);
        }
    }

    @Transactional
    public ArchivoCliente subirArchivoCliente(Long idCliente, MultipartFile file, String usuarioSubida,
            String categoria) {
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            fileExtension = originalFileName.substring(i);
        }

        String physicalFileName = UUID.randomUUID().toString() + fileExtension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(physicalFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            ArchivoCliente archivo = new ArchivoCliente();
            archivo.setCliente(cliente);
            archivo.setNombreVisible(originalFileName);
            archivo.setNombreFisico(physicalFileName);
            archivo.setTipoArchivo(file.getContentType());
            archivo.setUsuarioSubida(usuarioSubida);
            archivo.setCategoria(categoria != null ? categoria : "Otros"); // Asignar categoría o defecto

            return archivoClienteRepository.save(archivo);
        } catch (IOException ex) {
            throw new RuntimeException("No se pudo guardar el archivo " + originalFileName, ex);
        }
    }

    @Transactional
    public ArchivoTramite subirArchivoTramite(Long idTramite, MultipartFile file, String usuarioSubida) {
        Tramite tramite = tramiteRepository.findById(idTramite)
                .orElseThrow(() -> new RuntimeException("Trámite no encontrado"));

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            fileExtension = originalFileName.substring(i);
        }

        String physicalFileName = UUID.randomUUID().toString() + fileExtension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(physicalFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            ArchivoTramite archivo = new ArchivoTramite();
            archivo.setTramite(tramite);
            archivo.setNombreVisible(originalFileName);
            archivo.setNombreFisico(physicalFileName);
            archivo.setTipoArchivo(file.getContentType());
            archivo.setUsuarioSubida(usuarioSubida);

            return archivoTramiteRepository.save(archivo);
        } catch (IOException ex) {
            throw new RuntimeException("No se pudo guardar el archivo " + originalFileName, ex);
        }
    }

    @Transactional(readOnly = true)
    public List<ArchivoCliente> listarArchivosCliente(Long idCliente) {
        return archivoClienteRepository.findByCliente_IdCliente(idCliente);
    }

    @Transactional(readOnly = true)
    public List<ArchivoTramite> listarArchivosTramite(Long idTramite) {
        return archivoTramiteRepository.findByTramite_IdTramite(idTramite);
    }

    public Path cargarArchivo(String nombreFisico) {
        try {
            Path filePath = this.fileStorageLocation.resolve(nombreFisico).normalize();
            if (!Files.exists(filePath)) {
                throw new RuntimeException("Archivo no encontrado: " + nombreFisico);
            }
            return filePath;
        } catch (Exception ex) {
            throw new RuntimeException("Archivo no encontrado: " + nombreFisico, ex);
        }
    }
}
