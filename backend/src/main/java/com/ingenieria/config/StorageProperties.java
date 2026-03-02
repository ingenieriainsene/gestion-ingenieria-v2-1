package com.ingenieria.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    @NotBlank
    private String location;
}
