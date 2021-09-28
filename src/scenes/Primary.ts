import {ArcRotateCamera, Color3, CubeTexture, HemisphericLight, Material, Mesh, MeshBuilder, Scene, SceneLoader, StandardMaterial, Texture, Vector3, WebXRDefaultExperienceOptions, WebXRExperienceHelper, WebXRState} from "@babylonjs/core";

class Primary extends Scene {

    _xrHelper : WebXRExperienceHelper;

    constructor( engine, canvas ) {

        super( engine );

        let skybox = MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, this);
        let skyboxMaterial:StandardMaterial = new StandardMaterial("skyBox", this);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture  = new CubeTexture("assets/scenes/TropicalSunnyDay", this);
        skyboxMaterial.reflectionTexture.coordinatesMode  = Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        SceneLoader.ImportMesh("", "assets/scenes/", "test.babylon",this,( meshes)=>{
            for ( let mMat of meshes ){
                if ( mMat.material ) {
                    console.log(mMat.material);
                    (mMat.material as StandardMaterial).emissiveTexture = (mMat.material as StandardMaterial).diffuseTexture;
                    mMat.checkCollisions = true;
                }

                if ( mMat.name === "playerStart"){
                    //camera.position = mMat.position;
                    mMat.setEnabled( false );
                }

            }
            //Gravity and Collisions Enabled
            //this.gravity = new BABYLON.Vector3(0, -0.5, 0);
            this.collisionsEnabled = true;

            camera.checkCollisions = true;
            //camera.applyGravity = true;




            //if ( navigator.hasOwnProperty('xr')){
            this.createScene_EnableXR()
            //}


        });
        
        let camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), this);
        camera.attachControl(canvas, true);

        let light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), this);
        let sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, this);

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if ( ev.keyCode === 73) {
                if (this.debugLayer.isVisible()) {
                    this.debugLayer.hide();
                } else {
                    this.debugLayer.show();
                }
            }
        });
    }

    async createScene_EnableXR() {
        let t : WebXRDefaultExperienceOptions = new WebXRDefaultExperienceOptions();

        this.createDefaultXRExperienceAsync( t ).then(respose => {
            this._xrHelper = respose.baseExperience;
            console.log(respose);

            this._xrHelper.onStateChangedObservable.add(function (state) {
                console.log(state);
                switch (state) {
                    case WebXRState.IN_XR:
                        // XR is initialized and already submitted one frame
                        //_menuParent.parent = undefined; //this._xrHelper.camera.inputs.camera;
                        //_menuParent.position.z = 10;
                        this._inXR = true;
                    case WebXRState.ENTERING_XR:
                    // xr is being initialized, enter XR request was made
                    case WebXRState.EXITING_XR:
                    // xr exit request was made. not yet done.
                    case WebXRState.NOT_IN_XR:
                    // self explanatory - either out or not yet in XR
                }
            })
        });


        // From fullscreenVR to 2D view
        /*
       this.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                    parameter: 'e' //press "e" key
                },
                function () {
                    this._xrHelper.exitVR();
                    document.exitFullscreen();
                }
            ));
    
         */
        //scene.actionManager = new BABYLON.ActionManager(scene);


    }
}

export { Primary };
