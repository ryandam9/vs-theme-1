// Package sample exercises every gopls semantic token type.
package sample

import (
	"errors"
	"fmt"
)

const MaxRetries = 3 // variable.readonly

var ErrNotFound = errors.New("not found") // variable

type Status int // type + type.declaration

const (
	Pending Status = iota // enumMember-ish (gopls emits variable.readonly)
	Active
)

type Store interface { // interface
	Get(key string) (string, error) // method.declaration
}

type memStore struct { // struct
	data  map[string]string // property
	limit int
}

func New(limit int) *memStore { // function.declaration, parameter
	return &memStore{data: make(map[string]string), limit: limit}
}

func (s *memStore) Get(key string) (string, error) { // method
	v, ok := s.data[key]
	if !ok {
		return "", fmt.Errorf("%w: %q", ErrNotFound, key) // defaultLibrary
	}
	return v, nil
}
