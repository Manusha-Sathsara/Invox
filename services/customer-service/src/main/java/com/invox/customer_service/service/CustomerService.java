package com.invox.customer_service.service;

import com.invox.customer_service.dto.CustomerRequestDTO;
import com.invox.customer_service.dto.CustomerResponseDTO;

import java.util.List;
import java.util.UUID;

public interface CustomerService {

    List<CustomerResponseDTO> getAllCustomers(String search, Boolean activeOnly);

    CustomerResponseDTO getCustomerById(UUID id);

    CustomerResponseDTO createCustomer(CustomerRequestDTO request);

    CustomerResponseDTO updateCustomer(UUID id, CustomerRequestDTO request);

    void deleteCustomer(UUID id, boolean hardDelete);
}
