package com.ingenieria.service;

import com.ingenieria.dto.CitaDTO;
import com.ingenieria.model.Cita;
import com.ingenieria.model.Cliente;
import com.ingenieria.model.Usuario;
import com.ingenieria.repository.CitaRepository;
import com.ingenieria.repository.ClienteRepository;
import com.ingenieria.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CitaService {

    private final CitaRepository citaRepo;
    private final ClienteRepository clienteRepo;
    private final UsuarioRepository usuarioRepo;

    public CitaService(CitaRepository citaRepo, ClienteRepository clienteRepo, UsuarioRepository usuarioRepo) {
        this.citaRepo = citaRepo;
        this.clienteRepo = clienteRepo;
        this.usuarioRepo = usuarioRepo;
    }

    @Transactional(readOnly = true)
    public List<CitaDTO> findByRange(LocalDateTime from, LocalDateTime to) {
        return citaRepo.findByRange(from, to).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CitaDTO create(CitaDTO dto) {
        validar(dto, null);
        Cita c = new Cita();
        apply(c, dto);
        return toDto(citaRepo.save(c));
    }

    @Transactional
    public CitaDTO update(Long id, CitaDTO dto) {
        Cita c = citaRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Cita no encontrada"));
        validar(dto, id);
        apply(c, dto);
        return toDto(citaRepo.save(c));
    }

    @Transactional
    public void delete(Long id) {
        citaRepo.deleteById(id);
    }

    private void validar(CitaDTO dto, Long excludeId) {
        if (dto.getClienteId() == null) throw new IllegalArgumentException("clienteId es obligatorio");
        if (dto.getUsuarioId() == null) throw new IllegalArgumentException("usuarioId es obligatorio");
        if (dto.getTitulo() == null || dto.getTitulo().isBlank()) throw new IllegalArgumentException("titulo es obligatorio");
        if (dto.getFechaInicio() == null || dto.getFechaFin() == null) {
            throw new IllegalArgumentException("fechaInicio y fechaFin son obligatorias");
        }
        if (!dto.getFechaFin().isAfter(dto.getFechaInicio())) {
            throw new IllegalArgumentException("La fecha fin debe ser posterior a la de inicio");
        }
        List<Cita> overlaps = citaRepo.findOverlaps(dto.getUsuarioId(), dto.getFechaInicio(), dto.getFechaFin(), excludeId);
        if (!overlaps.isEmpty()) {
            throw new IllegalArgumentException("El técnico ya tiene una cita en ese horario");
        }
    }

    private void apply(Cita c, CitaDTO dto) {
        Cliente cliente = clienteRepo.findById(dto.getClienteId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no válido"));
        Usuario usuario = usuarioRepo.findById(dto.getUsuarioId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no válido"));
        c.setCliente(cliente);
        c.setUsuario(usuario);
        c.setTitulo(dto.getTitulo().trim());
        c.setEstado(dto.getEstado() != null ? dto.getEstado().trim() : "Programada");
        c.setEnlaceRemoto(dto.getEnlaceRemoto());
        c.setNotas(dto.getNotas());
        c.setFechaInicio(dto.getFechaInicio());
        c.setFechaFin(dto.getFechaFin());
        c.setRecordatorioMin(dto.getRecordatorioMin() != null ? dto.getRecordatorioMin() : 15);
    }

    private CitaDTO toDto(Cita c) {
        CitaDTO dto = new CitaDTO();
        dto.setIdCita(c.getIdCita());
        dto.setClienteId(c.getCliente() != null ? c.getCliente().getIdCliente() : null);
        dto.setUsuarioId(c.getUsuario() != null ? c.getUsuario().getIdUsuario() : null);
        dto.setTitulo(c.getTitulo());
        dto.setEstado(c.getEstado());
        dto.setEnlaceRemoto(c.getEnlaceRemoto());
        dto.setNotas(c.getNotas());
        dto.setFechaInicio(c.getFechaInicio());
        dto.setFechaFin(c.getFechaFin());
        dto.setRecordatorioMin(c.getRecordatorioMin());
        return dto;
    }
}
