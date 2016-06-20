# ==============================================================================
# config

.PHONY: default build clean install lint publish test

default: test

WATCH ?= false

# ==============================================================================
# phony targets

build:
	./node_modules/.bin/babel src --ignore __tests__,__mocks__ --out-dir dist

clean:
	@- rm -rf node_modules

install:
	npm install

lint: | node_modules
	./node_modules/.bin/standard

publish: build
	npm publish

test: | node_modules
	@ if [ "$(WATCH)" = false ]; then \
		./node_modules/.bin/jest; \
	else \
		./node_modules/.bin/jest --watch; \
	fi

# ==============================================================================
# file targets

node_modules:
	npm install
