CXX ?= g++
CXXFLAGS ?= -std=c++17 -O2 -Wall -Wextra -pedantic -Ithird_party

SRC := $(wildcard src/*.cpp)
BIN := bin/allocator

.PHONY: all run clean

all: $(BIN)

$(BIN): $(SRC)
	mkdir -p bin
	$(CXX) $(CXXFLAGS) $(SRC) -o $(BIN)

run: $(BIN)
	./$(BIN) data/synthetic_input.json output

clean:
	rm -rf bin
	rm -f output/*.json
