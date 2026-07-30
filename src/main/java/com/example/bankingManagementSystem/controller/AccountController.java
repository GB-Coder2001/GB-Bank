package com.example.bankingManagementSystem.controller;

import com.example.bankingManagementSystem.dto.AccountDto;
import com.example.bankingManagementSystem.service.AccountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }
    @PostMapping
    public ResponseEntity<AccountDto> creatAccount(@RequestBody AccountDto account){
        return new ResponseEntity<>(accountService.creatAccount(account), HttpStatus.CREATED) ;
    }
    @GetMapping("/{id}")
    public ResponseEntity<AccountDto> getAccountById(@PathVariable Long id){
        AccountDto accountDto = accountService.getAccountById(id);
        return new ResponseEntity<>(accountDto, HttpStatus.OK);
    }
    @PostMapping("/{id}/deposit")
    public ResponseEntity<AccountDto> depositAmount(@PathVariable long id, @RequestBody Map<String, Double> request){
        Double amount = request.get("amount");
        AccountDto accountDto = accountService.depositAmount(id, amount);
        return new ResponseEntity<>(accountDto, HttpStatus.OK);
    }
    @PostMapping("/{id}/withdraw")
    public ResponseEntity<AccountDto> withdrawAmount(@PathVariable Long id, @RequestBody  Map<String, Double> request){
        Double amount = request.get("amount");
    AccountDto accountDto = accountService.withdrawAmount(id, amount);
    return new ResponseEntity <>(accountDto, HttpStatus.OK);
    }
    @GetMapping
    public ResponseEntity<List<AccountDto>> getAllAccounts(){
        List<AccountDto> accountDtos = accountService.getAllAccounts();
        return new ResponseEntity<>(accountDtos, HttpStatus.OK);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteAccount(@PathVariable Long id){
        accountService.deleteAccount(id);
        return new ResponseEntity<>("Account deleted successfully", HttpStatus.OK);
    }
}
