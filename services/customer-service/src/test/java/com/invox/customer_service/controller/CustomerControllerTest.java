package com.invox.customer_service.controller;

import com.invox.customer_service.dto.CustomerRequestDTO;
import com.invox.customer_service.dto.CustomerResponseDTO;
import com.invox.customer_service.service.CustomerService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerControllerTest {

    @Mock
    private CustomerService customerService;

    @InjectMocks
    private CustomerController customerController;

    @Test
    void testGetAllCustomers() {
        CustomerResponseDTO response = CustomerResponseDTO.builder()
                .id(UUID.randomUUID())
                .name("Acme Corp")
                .email("info@acme.com")
                .build();

        when(customerService.getAllCustomers(null, true)).thenReturn(List.of(response));

        ResponseEntity<List<CustomerResponseDTO>> result = customerController.getAllCustomers(null, true);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(1, result.getBody().size());
        assertEquals("Acme Corp", result.getBody().get(0).getName());
    }

    @Test
    void testGetCustomerById() {
        UUID id = UUID.randomUUID();
        CustomerResponseDTO response = CustomerResponseDTO.builder()
                .id(id)
                .name("Acme Corp")
                .email("info@acme.com")
                .build();

        when(customerService.getCustomerById(id)).thenReturn(response);

        ResponseEntity<CustomerResponseDTO> result = customerController.getCustomerById(id);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(id, result.getBody().getId());
    }

    @Test
    void testCreateCustomer() {
        CustomerRequestDTO request = CustomerRequestDTO.builder()
                .name("Acme Corp")
                .email("info@acme.com")
                .build();

        UUID id = UUID.randomUUID();
        CustomerResponseDTO response = CustomerResponseDTO.builder()
                .id(id)
                .name("Acme Corp")
                .email("info@acme.com")
                .build();

        when(customerService.createCustomer(request)).thenReturn(response);

        ResponseEntity<CustomerResponseDTO> result = customerController.createCustomer(request);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(id, result.getBody().getId());
    }

    @Test
    void testUpdateCustomer() {
        UUID id = UUID.randomUUID();
        CustomerRequestDTO request = CustomerRequestDTO.builder()
                .name("Acme Corp Updated")
                .email("info@acme.com")
                .build();

        CustomerResponseDTO response = CustomerResponseDTO.builder()
                .id(id)
                .name("Acme Corp Updated")
                .email("info@acme.com")
                .build();

        when(customerService.updateCustomer(id, request)).thenReturn(response);

        ResponseEntity<CustomerResponseDTO> result = customerController.updateCustomer(id, request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals("Acme Corp Updated", result.getBody().getName());
    }

    @Test
    void testDeleteCustomer() {
        UUID id = UUID.randomUUID();
        doNothing().when(customerService).deleteCustomer(id, false);

        ResponseEntity<Void> result = customerController.deleteCustomer(id, false);

        assertEquals(HttpStatus.NO_CONTENT, result.getStatusCode());
        verify(customerService, times(1)).deleteCustomer(id, false);
    }
}
