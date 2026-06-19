package com.example.demo.config;

import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Runs Flyway {@code repair()} before {@code migrate()} so local or shared databases recover
 * when a migration file was edited after it was already applied (checksum mismatch on validate).
 */
@Configuration
public class FlywayRepairConfig {

	@Bean
	public FlywayMigrationStrategy flywayMigrationStrategy() {
		return flyway -> {
			flyway.repair();
			flyway.migrate();
		};
	}
}
