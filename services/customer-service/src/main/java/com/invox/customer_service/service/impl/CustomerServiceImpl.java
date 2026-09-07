package com.invox.customer_service.service.impl;

import com.invox.customer_service.dto.CustomerRequestDTO;
import com.invox.customer_service.dto.CustomerResponseDTO;
import com.invox.customer_service.entity.Customer;
import com.invox.customer_service.exception.ResourceNotFoundException;
import com.invox.customer_service.multitenancy.TenantContext;
import com.invox.customer_service.repository.CustomerRepository;
import com.invox.customer_service.service.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CustomerResponseDTO> getAllCustomers(String search, Boolean activeOnly) {
        String tenantId = getEffectiveTenantId();
        log.debug("Fetching customers for tenant: {}, search: {}, activeOnly: {}", tenantId, search, activeOnly);

        List<Customer> customers;
        if (search != null && !search.trim().isEmpty()) {
            customers = customerRepository.searchCustomers(tenantId, search.trim());
        } else if (activeOnly == null || Boolean.TRUE.equals(activeOnly)) {
            customers = customerRepository.findByTenantIdAndActiveOrderByCreatedAtDesc(tenantId, true);
        } else {
            customers = customerRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        }

        return customers.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponseDTO getCustomerById(UUID id) {
        String tenantId = getEffectiveTenantId();
        log.debug("Fetching customer with ID: {} for tenant: {}", id, tenantId);

        Customer customer = customerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + id));

        return mapToResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponseDTO createCustomer(CustomerRequestDTO request) {
        String tenantId = getEffectiveTenantId();
        log.info("Creating customer '{}' ({}) for tenant '{}'", request.getName(), request.getEmail(), tenantId);

        Customer customer = Customer.builder()
                .tenantId(tenantId)
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .country(request.getCountry() != null ? request.getCountry().trim() : null)
                .addressLine1(request.getAddressLine1() != null ? request.getAddressLine1().trim() : null)
                .addressLine2(request.getAddressLine2() != null ? request.getAddressLine2().trim() : null)
                .city(request.getCity() != null ? request.getCity().trim() : null)
                .state(request.getState() != null ? request.getState().trim() : null)
                .postalCode(request.getPostalCode() != null ? request.getPostalCode().trim() : null)
                .currency(request.getCurrency() != null && !request.getCurrency().isBlank() ? request.getCurrency().trim() : "USD")
                .taxId(request.getTaxId() != null ? request.getTaxId().trim() : null)
                .contactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null)
                .notes(request.getNotes())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Customer saved = customerRepository.save(customer);
        log.info("Created customer with ID: {} for tenant: {}", saved.getId(), tenantId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CustomerResponseDTO updateCustomer(UUID id, CustomerRequestDTO request) {
        String tenantId = getEffectiveTenantId();
        log.info("Updating customer with ID: {} for tenant: {}", id, tenantId);

        Customer customer = customerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + id));

        customer.setName(request.getName().trim());
        customer.setEmail(request.getEmail().trim().toLowerCase());
        customer.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        customer.setCountry(request.getCountry() != null ? request.getCountry().trim() : null);
        customer.setAddressLine1(request.getAddressLine1() != null ? request.getAddressLine1().trim() : null);
        customer.setAddressLine2(request.getAddressLine2() != null ? request.getAddressLine2().trim() : null);
        customer.setCity(request.getCity() != null ? request.getCity().trim() : null);
        customer.setState(request.getState() != null ? request.getState().trim() : null);
        customer.setPostalCode(request.getPostalCode() != null ? request.getPostalCode().trim() : null);
        if (request.getCurrency() != null && !request.getCurrency().isBlank()) {
            customer.setCurrency(request.getCurrency().trim());
        }
        customer.setTaxId(request.getTaxId() != null ? request.getTaxId().trim() : null);
        customer.setContactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null);
        customer.setNotes(request.getNotes());
        if (request.getActive() != null) {
            customer.setActive(request.getActive());
        }

        Customer updated = customerRepository.save(customer);
        log.info("Updated customer with ID: {} for tenant: {}", updated.getId(), tenantId);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCustomer(UUID id, boolean hardDelete) {
        String tenantId = getEffectiveTenantId();
        log.info("Deleting customer with ID: {} (hardDelete={}) for tenant: {}", id, hardDelete, tenantId);

        Customer customer = customerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + id));

        if (hardDelete) {
            customerRepository.delete(customer);
            log.info("Permanently deleted customer with ID: {} for tenant: {}", id, tenantId);
        } else {
            customer.setActive(false);
            customerRepository.save(customer);
            log.info("Soft deleted customer with ID: {} for tenant: {}", id, tenantId);
        }
    }

    private String getEffectiveTenantId() {
        String tenantId = TenantContext.getTenantId();
        return (tenantId != null && !tenantId.isBlank()) ? tenantId : "default-tenant";
    }

    private CustomerResponseDTO mapToResponse(Customer customer) {
        return CustomerResponseDTO.builder()
                .id(customer.getId())
                .tenantId(customer.getTenantId())
                .name(customer.getName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .country(customer.getCountry())
                .addressLine1(customer.getAddressLine1())
                .addressLine2(customer.getAddressLine2())
                .city(customer.getCity())
                .state(customer.getState())
                .postalCode(customer.getPostalCode())
                .currency(customer.getCurrency())
                .taxId(customer.getTaxId())
                .contactPerson(customer.getContactPerson())
                .notes(customer.getNotes())
                .active(customer.getActive())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }
}
