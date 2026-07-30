package com.example.bankingManagementSystem.service;

import com.example.bankingManagementSystem.dto.AccountDto;
import com.example.bankingManagementSystem.entity.Account;

import java.util.List;

public interface AccountService {
    AccountDto creatAccount(AccountDto account);
    AccountDto getAccountById(Long id);
    AccountDto depositAmount(Long id, Double amount);
    AccountDto withdrawAmount(Long id, Double amount);
    List<AccountDto> getAllAccounts();
    void deleteAccount(Long id);
}
