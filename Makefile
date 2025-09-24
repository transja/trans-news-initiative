PHONY: github transja

protect:
	cd build/staging && npx staticrypt --short index.html -p $(shell grep PASSWORD .env | cut -d '=' -f2) -d .

github:
	rm -rf docs
	cp -r build docs
	touch docs/.nojekyll
	cp CNAME docs/
	git add -A
	git commit -m "update github pages"
	git push