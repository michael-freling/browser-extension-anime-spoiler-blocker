.PHONY: build
build:
	mkdir -p build
	cp -r manifest.json assets build/
	npx tsc

.PHONY: build
watch:
	mkdir -p build
	cp -r manifest.json assets build/
	npx tsc --watch

.PHONY: clean
clean:
	rm -rf build
