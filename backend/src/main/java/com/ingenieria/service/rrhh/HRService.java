package com.ingenieria.service.rrhh;

import com.ingenieria.dto.rrhh.CreateEmpleadoRequest;
import com.ingenieria.dto.rrhh.EmpleadoResponse;
import com.ingenieria.dto.rrhh.SolicitarAusenciaRequest;
import com.ingenieria.model.rrhh.*;
import com.ingenieria.repository.rrhh.AusenciaRepository;
import com.ingenieria.repository.rrhh.EmpleadoRepository;
import com.ingenieria.repository.rrhh.SaldoVacacionesRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@Transactional
public class HRService {

    private final EmpleadoRepository empleadoRepo;
    private final SaldoVacacionesRepository saldoRepo;
    private final AusenciaRepository ausenciaRepo;

    public HRService(EmpleadoRepository empleadoRepo, SaldoVacacionesRepository saldoRepo, AusenciaRepository ausenciaRepo) {
        this.empleadoRepo = empleadoRepo;
        this.saldoRepo = saldoRepo;
        this.ausenciaRepo = ausenciaRepo;
    }

    public EmpleadoResponse onboardEmployee(CreateEmpleadoRequest req) {
        Empleado emp = new Empleado();
        emp.setNombreCompleto(req.nombreCompleto());
        emp.setDniNie(req.dniNie());
        emp.setPuesto(req.puesto());
        emp.setFechaAlta(req.fechaAlta() != null ? req.fechaAlta() : LocalDate.now());
        emp.setEstado(EmployeeStatus.ACTIVO);
        
        Empleado saved = empleadoRepo.save(emp);

        SaldoVacaciones saldo = new SaldoVacaciones();
        saldo.setEmpleado(saved);
        saldo.setAnio(LocalDate.now().getYear());
        saldo.setDiasTotales(22);
        saldo.setDiasDisfrutados(0);
        saldoRepo.save(saldo);

        return new EmpleadoResponse(saved.getId(), saved.getNombreCompleto(), saved.getDniNie(), saved.getPuesto(), saved.getEstado());
    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public void offboardEmployee(UUID empleadoId) {
        Empleado emp = empleadoRepo.findById(empleadoId)
            .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        emp.setEstado(EmployeeStatus.INACTIVO);
        emp.setFechaBaja(LocalDate.now());
        empleadoRepo.save(emp);
    }

    public void requestAbsence(SolicitarAusenciaRequest req) {
        if (req.tipo() == AbsenceType.VACACIONES) {
            int anio = req.fechaInicio().getYear();
            SaldoVacaciones saldo = saldoRepo.findByEmpleadoIdAndAnio(req.empleadoId(), anio)
                .orElseThrow(() -> new RuntimeException("Saldo no encontrado para el año."));
                
            if ((saldo.getDiasTotales() - saldo.getDiasDisfrutados()) < req.diasSolicitados()) {
                throw new IllegalArgumentException("Días de vacaciones insuficientes.");
            }
        }

        Ausencia abs = new Ausencia();
        abs.setEmpleado(empleadoRepo.getReferenceById(req.empleadoId()));
        abs.setTipo(req.tipo());
        abs.setFechaInicio(req.fechaInicio());
        abs.setFechaFin(req.fechaFin());
        abs.setDiasSolicitados(req.diasSolicitados());
        abs.setEstado(AbsenceStatus.PENDIENTE);
        ausenciaRepo.save(abs);
    }
}
