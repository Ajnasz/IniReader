all: test
test: oldtest
	@echo '========== NEW TESTS =========='
	chmod -w ize-nowrite.ini
	node ./test.js
oldtest:
	@echo '========== OLD TESTS =========='
	node ./test-old.js

testconv:
	unix2mac -n ize-unix.ini ize-mac.ini
	unix2dos -n ize-unix.ini ize-dos.ini

.PHONY: oldtest test
