all: test

test:
	@(cd tests && $(MAKE))