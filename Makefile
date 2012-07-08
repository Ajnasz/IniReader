all: test

doc:
	yuidoc .
test:
	@(cd tests && $(MAKE))
