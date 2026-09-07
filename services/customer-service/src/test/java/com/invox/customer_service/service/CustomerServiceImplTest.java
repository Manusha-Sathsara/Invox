package com.invox.customer_service.service;

import com.invox.customer_service.dto.CustomerRequestDTO;
import com.invox.customer_service.dto.CustomerResponseDTO;
import com.invox.customer_service.entity.Customer;
import com.invox.customer_service.exception.ResourceNotFoundException;
import com.invox.customer_service.multitenancy.TenantContext;
import com.invox.customer_service.repository.CustomerRepository;
import com.invox.customer_service.service.impl.CustomerServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceImplTest {

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CustomerServiceImpl customerService;

    private static final String TEST_TENANT = "tenant-123";

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TEST_TENANT);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void testCreateCustomer_Success() {
        CustomerRequestDTO request = CustomerRequestDTO.builder()
                .name("Acme Corp")
                .email("billing@acme.com")
                .phone("+1-555-0199")
                .country("USA")
                .city("New York")
                .build();

        UUID generatedId = UUID.randomUUID();
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer c = invocation.getArgument(0);
            c.setId(generatedId);
            return c;
        });

        CustomerResponseDTO response = customerService.createCustomer(request);

        assertNotNull(response);
        assertEquals(generatedId, response.getId());
        assertEquals(TEST_TENANT, response.getTenantId());
        assertEquals("Acme Corp", response.getName());
        assertEquals("billing@acme.com", response.getEmail());
        assertEquals("USD", response.getCurrency());
        assertTrue(response.getActive());
        verify(customerRepository, times(1)).save(any(Customer.class));
    }

    @Test
    void testGetCustomerById_Found() {
        UUID id = UUID.randomUUID();
        Customer customer = Customer.builder()
                .id(id)
                .tenantId(TEST_TENANT)
                .name("Acme Corp")
                .email("billing@acme.com")
                .active(true)
                .build();

        when(customerRepository.findByIdAndTenantId(id, TEST_TENANT)).thenReturn(Optional.of(customer));

        CustomerResponseDTO response = customerService.getCustomerById(id);

        assertNotNull(response);
        assertEquals(id, response.getId());
        assertEquals(TEST_TENANT, response.getTenantId());
        assertEquals("Acme Corp", response.getName());
    }

    @Test
    void testGetCustomerById_NotFound() {
        UUID id = UUID.randomUUID();
        when(customerRepository.findByIdAndTenantId(id, TEST_TENANT)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> customerService.getCustomerById(id));
    }

    @Test
    void testGetAllCustomers_WithSearch() {
        Customer customer = Customer.builder()
                .id(UUID.randomUUID())
                .tenantId(TEST_TENANT)
                .name("Acme Corp")
                .email("billing@acme.com")
                .active(true)
                .build();

        when(customerRepository.searchCustomers(TEST_TENANT, "acme")).thenReturn(List.of(customer));

        List<CustomerResponseDTO> result = customerService.getAllCustomers("acme", true);

        assertEquals(1, result.size());
        assertEquals("Acme Corp", result.get(0).getName());
        verify(customerRepository, times(1)).searchCustomers(TEST_TENANT, "acme");
    }

    @Test
    void testDeleteCustomer_SoftDelete() {
        UUID id = UUID.randomUUID();
        Customer customer = Customer.builder()
                .id(id)
                .tenantId(TEST_TENANT)
                .name("Acme Corp")
                .email("billing@acme.com")
                .active(true)
                .build();

        when(customerRepository.findByIdAndTenantId(id, TEST_TENANT)).thenReturn(Optional.of(customer));

        customerService.deleteCustomer(id, false);

        assertFalse(customer.getActive());
        verify(customerRepository, times(1)).save(customer);
        verify(customerRepository, never()).delete(any());
    }

    @Test
    void testDeleteCustomer_HardDelete() {
        UUID id = UUID.randomUUID();
        Customer customer = Customer.builder()
                .id(id)
                .tenantId(TEST_TENANT)
                .name("Acme Corp")
                .email("billing@acme.com")
                .active(true)
                .build();

        when(customerRepository.findByIdAndTenantId(id, TEST_TENANT)).thenReturn(Optional.of(customer));

        customerService.deleteCustomer(id, true);

        verify(customerRepository, times(1)).delete(customer);
        verify(customerRepository, never()).save(customer);
    }
}
