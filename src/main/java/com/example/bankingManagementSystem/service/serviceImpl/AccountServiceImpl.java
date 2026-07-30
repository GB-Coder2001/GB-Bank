package com.example.bankingManagementSystem.service.serviceImpl;

import com.example.bankingManagementSystem.dto.AccountDto;
import com.example.bankingManagementSystem.entity.Account;
import com.example.bankingManagementSystem.mapper.AccountMapper;
import com.example.bankingManagementSystem.repository.AccountRepository;
import com.example.bankingManagementSystem.service.AccountService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccountServiceImpl implements AccountService {
    private final AccountRepository accountRepository;

    public AccountServiceImpl(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public AccountDto creatAccount(AccountDto accountDto) {
       Account account = AccountMapper.mapToAccount(accountDto);
       Account savedAccount = accountRepository.save(account);
       return AccountMapper.mapToAccountDto(savedAccount);
    }

    @Override
    public AccountDto getAccountById(Long id) {
        Account account = accountRepository.findById(id).orElseThrow(()->
                new RuntimeException("ACCOUNT NOT EXIST FOR THIS PARTICULAR ID"));
        return AccountMapper.mapToAccountDto(account);
    }

    @Override
    public AccountDto depositAmount(Long id, Double amount) {
        Account account = accountRepository.findById(id).orElseThrow(()->
                new RuntimeException("ACCOUNT NOT EXIST FOR THIS PARTICULAR ID"));
        account.setBalance(account.getBalance() + amount);
        Account savedAccount = accountRepository.save(account);
        return AccountMapper.mapToAccountDto(savedAccount);

    }

    @Override
    public AccountDto withdrawAmount(Long id, Double amount) {
        Account account = accountRepository.findById(id).orElseThrow(()->
                new RuntimeException("ACCOUNT NOT EXIST FOR THIS PARTICULAR ID"));
        if (account.getBalance() < amount){
            throw new RuntimeException("INSUFFICIENT BALANCE");
        }
        account.setBalance(account.getBalance() - amount);
        Account savedAccount = accountRepository.save(account);
        return AccountMapper.mapToAccountDto(savedAccount);

    }

    @Override
    public List<AccountDto> getAllAccounts() {
        List<Account> accounts = accountRepository.findAll();
        return accounts.stream().map((Account account)->AccountMapper.mapToAccountDto(account)).collect(Collectors.toList());

    }

    @Override
    public void deleteAccount(Long id) {
        Account account = accountRepository.findById(id).orElseThrow(()->
                new RuntimeException("ACCOUNT NOT EXIST FOR THIS PARTICULAR ID"));
        accountRepository.deleteById(id);
    }
}
