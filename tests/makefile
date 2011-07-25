all: test
test: oldtest
	@echo '========== NEW TESTS =========='
	node ./test.js
oldtest:
	@echo '========== OLD TESTS =========='
	node ./test-old.js
.PHONY: oldtest test