package com.example.bankingManagementSystem.repository;

import com.example.bankingManagementSystem.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account,Long> {
}
