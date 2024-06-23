.PHONY: build
build:
	mkdir -p build
	cp -r manifest.json assets data build/
	npm run webpack --mode=development

.PHONY: build
watch:
	mkdir -p build
	cp -r manifest.json assets data build/
	npm run watch

.PHONY: clean
clean:
	rm -rf build
