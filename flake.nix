{
  description = "Choreo - iOS app built with Expo / React Native";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            if [ ! -d node_modules ]; then
              echo "node_modules not found — run: npm install"
            fi
            echo ""
            echo "Choreo dev shell ready."
            echo "  npm install   — install dependencies"
            echo "  npm start     — start Expo dev server"
            echo ""
          '';
        };
      });
}
