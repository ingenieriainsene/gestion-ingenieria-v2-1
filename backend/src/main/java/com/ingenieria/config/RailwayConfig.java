package com.ingenieria.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class RailwayConfig {

    private static final Logger log = LoggerFactory.getLogger(RailwayConfig.class);

    @Value("${DATABASE_URL:#{null}}")
    private String databaseUrl;

    @Value("${SPRING_DATASOURCE_URL:#{null}}")
    private String springDatasourceUrl;

    @Value("${SPRING_DATASOURCE_USERNAME:#{null}}")
    private String springDatasourceUsername;

    @Value("${SPRING_DATASOURCE_PASSWORD:#{null}}")
    private String springDatasourcePassword;

    @Bean
    @org.springframework.context.annotation.Primary
    public DataSource dataSource() {
        DataSourceBuilder<?> dataSourceBuilder = DataSourceBuilder.create();

        // Si existe DATABASE_URL (Railway, Heroku, etc) y no se proveyó explícitamente SPRING_DATASOURCE_URL
        if (databaseUrl != null && !databaseUrl.isEmpty() && 
            (springDatasourceUrl == null || springDatasourceUrl.isEmpty() || springDatasourceUrl.contains("127.0.0.1:54322"))) {
            try {
                log.info("Configuring database from DATABASE_URL...");
                URI dbUri = new URI(databaseUrl);

                String username = dbUri.getUserInfo().split(":")[0];
                String password = dbUri.getUserInfo().split(":")[1];
                String dbUrl = "jdbc:postgresql://" + dbUri.getHost() + ':' + dbUri.getPort() + dbUri.getPath();

                dataSourceBuilder.url(dbUrl);
                dataSourceBuilder.username(username);
                dataSourceBuilder.password(password);
                return dataSourceBuilder.build();
            } catch (URISyntaxException e) {
                log.error("Failed to parse DATABASE_URL", e);
            }
        }

        // Fallback local o explícito
        log.info("Configuring database from local/explicit properties...");
        String finalUrl = (springDatasourceUrl != null && !springDatasourceUrl.isEmpty()) ? 
                          springDatasourceUrl : "jdbc:postgresql://127.0.0.1:54322/postgres";
        String finalUser = (springDatasourceUsername != null && !springDatasourceUsername.isEmpty()) ? 
                           springDatasourceUsername : "postgres";
        String finalPass = (springDatasourcePassword != null && !springDatasourcePassword.isEmpty()) ? 
                           springDatasourcePassword : "postgres";

        dataSourceBuilder.url(finalUrl);
        dataSourceBuilder.username(finalUser);
        dataSourceBuilder.password(finalPass);

        return dataSourceBuilder.build();
    }
}
