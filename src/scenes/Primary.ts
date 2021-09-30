import {ArcRotateCamera, Color3, CubeTexture, HemisphericLight, Material, Mesh, MeshBuilder, Scene, SceneLoader, StandardMaterial, Texture, Vector3, WebXRDefaultExperienceOptions, WebXRExperienceHelper, WebXRState} from "@babylonjs/core";
import {Player} from "../actors/Player";

class Primary extends Scene {

    _xrHelper : WebXRExperienceHelper;
    _triggerDown : boolean;
    _player:Player;


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

        let camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), this);
        camera.attachControl(canvas, true);

        let light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), this);
        let sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, this);

        SceneLoader.ImportMesh("", "assets/scenes/level_1/", "level_1.babylon",this,( meshes,p,s,a,atr,ag,al)=>{
            for ( let l of al ){
                l.setEnabled(false)
            }
            for ( let mMat of meshes ){
                if ( mMat.material ) {
                    console.log(mMat.material);
                    (mMat.material as StandardMaterial).emissiveTexture = (mMat.material as StandardMaterial).diffuseTexture;
                    mMat.checkCollisions = true;
                    mMat.isPickable = true;
                }

                if ( mMat.name === "playerStart"){
                    //camera.position = mMat.position;
                    //mMat.setEnabled( false );
                    this._player = new Player( this, mMat.position )
                    this._player.createScene_EnableXR( this, sphere )
                }
            }
            //Gravity and Collisions Enabled
            //this.gravity = new BABYLON.Vector3(0, -0.5, 0);
            this.collisionsEnabled = true;

            camera.checkCollisions = true;
            //camera.applyGravity = true;

            //if ( navigator.hasOwnProperty('xr')){

            //}

        });



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

        window.addEventListener('resize',()=>{
           this.getEngine().resize();
        });
    }
}

export { Primary };
