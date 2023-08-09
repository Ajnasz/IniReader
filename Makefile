all: test

test:
	@(cd tests && $(MAKE))

lint:
	@node_modules/.bin/eslint index.js lib/ tests --fix
