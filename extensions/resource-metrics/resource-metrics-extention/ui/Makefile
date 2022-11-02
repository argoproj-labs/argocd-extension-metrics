build:
	yarn build
	# dist/extension.tar must be committed into repo for install.yml to reference
	
reapply:
	kubectl delete -f ../manifests/install.yml -n argocd
	kubectl apply -f ../manifests/install.yml -n argocd

apply:
	kubectl apply -f ../manifests/install.yml -n argocd

delete:
	kubectl delete -f ../manifests/install.yml -n argocd