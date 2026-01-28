package com.ingenieria.service;

import com.ingenieria.model.Local;
import com.ingenieria.repository.LocalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class LocalService {
    @Autowired private LocalRepository localRepository;

    @Transactional(readOnly = true)
    public List<Local> findAll() { return localRepository.findAll(); }

    @Transactional(readOnly = true)
    public Local findById(Long id) { return localRepository.findById(id).orElseThrow(); }
    public Local save(Local local) { return localRepository.save(local); }
    public void delete(Long id) { localRepository.deleteById(id); }
}
