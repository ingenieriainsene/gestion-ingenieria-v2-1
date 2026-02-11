package com.ingenieria;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GestionIngenieriaApplication {

    public static void main(String[] args) {
        SpringApplication.run(GestionIngenieriaApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.boot.CommandLineRunner run(
            @org.springframework.beans.factory.annotation.Autowired org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        return args -> {
            System.out.println("GENERATED HASH FOR admin123: " + passwordEncoder.encode("admin123"));
        };
    }
}
