package com.ingenieria.config;

import com.ingenieria.model.Cliente;
import com.ingenieria.model.Contrato;
import com.ingenieria.model.Local;
import com.ingenieria.model.Presupuesto;
import com.ingenieria.model.PresupuestoLinea;
import com.ingenieria.model.Proveedor;
import com.ingenieria.model.ProveedorContacto;
import com.ingenieria.model.ProveedorOficio;
import com.ingenieria.model.Tramite;
import com.ingenieria.repository.ClienteRepository;
import com.ingenieria.repository.ContratoRepository;
import com.ingenieria.repository.LocalRepository;
import com.ingenieria.repository.PresupuestoRepository;
import com.ingenieria.repository.ProveedorRepository;
import com.ingenieria.repository.TramiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@ConditionalOnProperty(prefix = "app.seed", name = "demo", havingValue = "true", matchIfMissing = false)
public class DemoDataSeeder implements CommandLineRunner {

    @Autowired private ClienteRepository clienteRepository;
    @Autowired private LocalRepository localRepository;
    @Autowired private ContratoRepository contratoRepository;
    @Autowired private TramiteRepository tramiteRepository;
    @Autowired private ProveedorRepository proveedorRepository;
    @Autowired private PresupuestoRepository presupuestoRepository;

    @Override
    public void run(String... args) {
        if (clienteRepository.count() > 0 || contratoRepository.count() > 0 || proveedorRepository.count() > 0) {
            System.out.println(">>> DemoDataSeeder omitido: ya existen datos <<<");
            return;
        }

        Cliente cliente = new Cliente();
        cliente.setNombre("Ana");
        cliente.setApellido1("Gomez");
        cliente.setApellido2("Ruiz");
        cliente.setDni("00000000A");
        cliente.setDireccionFiscalCompleta("Calle Mayor 1, 28001 Madrid");
        cliente.setCodigoPostal("28001");
        cliente.setCuentaBancaria("ES0000000000000000000000");
        cliente.setCreadoPor("seed");
        cliente = clienteRepository.save(cliente);

        Local local = new Local();
        local.setCliente(cliente);
        local.setNombreTitular("Ana");
        local.setApellido1Titular("Gomez");
        local.setApellido2Titular("Ruiz");
        local.setDniTitular("00000000A");
        local.setDireccionCompleta("Calle Mayor 1, Madrid");
        local.setReferenciaCatastral("RC-0001");
        local.setCups("ES0000000000000000000");
        local.setCreadoPor("seed");
        local = localRepository.save(local);

        Contrato contrato = new Contrato();
        contrato.setCliente(cliente);
        contrato.setLocal(local);
        contrato.setFechaInicio(LocalDate.now().minusDays(7));
        contrato.setFechaVencimiento(LocalDate.now().plusYears(1));
        contrato.setTipoContrato("Instalacion FV");
        contrato.setCreadoPor("seed");
        contrato = contratoRepository.save(contrato);

        Tramite tramite = new Tramite();
        tramite.setContrato(contrato);
        tramite.setTipoTramite("Intervencion");
        tramite.setEstado("Pendiente");
        tramite.setEsUrgente(false);
        tramiteRepository.save(tramite);

        Proveedor proveedor = new Proveedor();
        proveedor.setNombreComercial("SolarTech");
        proveedor.setRazonSocial("SolarTech SL");
        proveedor.setEsAutonomo(false);
        proveedor.setCif("B12345678");
        proveedor.setDireccionFiscal("Av. Energia 10, Madrid");
        proveedor.setCreadoPor("seed");

        ProveedorContacto contacto = new ProveedorContacto();
        contacto.setProveedor(proveedor);
        contacto.setNombre("Carlos Perez");
        contacto.setCargo("Tecnico");
        contacto.setTelefono("600000000");
        contacto.setEmail("carlos@solartech.com");

        ProveedorOficio oficio = new ProveedorOficio();
        oficio.setProveedor(proveedor);
        oficio.setOficio("Electricista");

        proveedor.setContactos(new ArrayList<>(List.of(contacto)));
        proveedor.setOficios(new ArrayList<>(List.of(oficio)));
        proveedorRepository.save(proveedor);

        Presupuesto presupuesto = new Presupuesto();
        presupuesto.setCliente(cliente);
        presupuesto.setVivienda(local);
        presupuesto.setCodigoReferencia("PRES-001");
        presupuesto.setFecha(LocalDate.now());
        presupuesto.setEstado("Borrador");

        PresupuestoLinea capitulo = new PresupuestoLinea();
        capitulo.setPresupuesto(presupuesto);
        capitulo.setOrden(1);
        capitulo.setConcepto("Instalacion");
        capitulo.setTipoJerarquia(PresupuestoLinea.TipoJerarquia.CAPITULO);
        capitulo.setCodigoVisual("01");

        PresupuestoLinea partida = new PresupuestoLinea();
        partida.setPresupuesto(presupuesto);
        partida.setOrden(2);
        partida.setConcepto("Paneles solares");
        partida.setTipoJerarquia(PresupuestoLinea.TipoJerarquia.PARTIDA);
        partida.setCodigoVisual("01.01");
        partida.setCantidad(new BigDecimal("1.00"));
        partida.setPrecioUnitario(new BigDecimal("1000.00"));
        partida.setPvpUnitario(new BigDecimal("1000.00"));
        partida.setTotalPvp(new BigDecimal("1000.00"));
        partida.setIvaPorcentaje(new BigDecimal("21.00"));
        partida.setImporteIva(new BigDecimal("210.00"));
        partida.setTotalFinal(new BigDecimal("1210.00"));
        partida.setTotalLinea(new BigDecimal("1000.00"));
        partida.setPadre(capitulo);
        capitulo.getHijos().add(partida);

        presupuesto.getLineas().add(capitulo);
        presupuesto.getLineas().add(partida);
        presupuesto.setTotal(new BigDecimal("1210.00"));
        presupuesto.setTotalSinIva(new BigDecimal("1000.00"));
        presupuesto.setTotalConIva(new BigDecimal("1210.00"));

        presupuestoRepository.save(presupuesto);

        System.out.println(">>> DemoDataSeeder: datos base creados <<<");
    }
}
