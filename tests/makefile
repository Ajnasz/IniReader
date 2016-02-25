all: test
test: oldtest
	@echo '========== NEW TESTS =========='
	chmod -w ize-nowrite.ini
	node ./test.js
oldtest:
	@echo '========== OLD TESTS =========='
	node ./test-old.js
.PHONY: oldtest test
