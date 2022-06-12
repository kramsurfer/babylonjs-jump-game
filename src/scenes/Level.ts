import {
    ArcRotateCamera,
    PointLight,
    Color3,
    CubeTexture,
    HemisphericLight,
    Material,
    Mesh,
    MeshBuilder,
    Scene,
    SceneLoader,
    StandardMaterial,
    Texture,
    Vector3,
    WebXRDefaultExperienceOptions,
    WebXRExperienceHelper,
    WebXRState,
    GlowLayer, PointsCloudSystem, PointColor, SolidParticleSystem, Scalar
} from "@babylonjs/core";
import {Player} from "../actors/Player";
import "@babylonjs/inspector";
import "@babylonjs/core/Debug/debugLayer"
import {TriggerLandingPad} from "../actors/TriggerLandingPad";
import {extractHighlightsPixelShader} from "@babylonjs/core/Shaders/extractHighlights.fragment";
import {SphereEight} from "../geos/SphereEight";


class Level extends Scene {

    _xrHelper : WebXRExperienceHelper;
    _triggerDown : boolean;
    _player:Player;


    constructor( engine, canvas ) {

        super( engine );

        //let skybox = MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, this);
       // let skyboxMaterial:StandardMaterial = new StandardMaterial("skyBox", this);
       // skyboxMaterial.backFaceCulling = false;
        //skyboxMaterial.reflectionTexture  = new CubeTexture("assets/scenes/TropicalSunnyDay", this);
        //skyboxMaterial.reflectionTexture.coordinatesMode  = Texture.SKYBOX_MODE;
        //skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
       // skyboxMaterial.specularColor = new Color3(0, 0, 0);
        //skybox.material = skyboxMaterial;

        //this.fogColor = new Color3( 0,0,0)
        //this.fogEnd = 28;
        //this.fogStart = 2;
        //this.fogMode = 3;

        let camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), this);
        camera.attachControl(canvas, true);

        //let light1: HemisphericLight = new HemisphericLight("light1", new Vector3(0.1, 0.1, 0), this);
        //light1.intensity = 0.1;

        const SPS = new SolidParticleSystem("SPS", this, {enableDepthSort:true} ) ;
        const sphere = MeshBuilder.CreateSphere("s", { diameter: 0.2});
        const poly = MeshBuilder.CreatePolyhedron("p", { type: 2, size:0.2 });
        SPS.addShape(sphere, 200); // 20 spheres
        SPS.addShape(poly, 120); // 120 polyhedrons
        sphere.dispose(); //dispose of original model sphere
        poly.dispose(); //dispose of original model poly
        const mesh = SPS.buildMesh();

        // initiate particles function
        SPS.initParticles = () => {
            for (let p = 0; p < SPS.nbParticles; p++) {
                const particle = SPS.particles[p];
                particle.position.x = Scalar.RandomRange(-20, 20);
                particle.position.y = Scalar.RandomRange(-20, 20);
                particle.position.z = Scalar.RandomRange(-20, 20);
                let ranSize = Math.random()*0.5 + 0.2
                particle.scaling = new Vector3( ranSize, ranSize,ranSize);
                particle.cullingStrategy = 3;
            }
        };

        mesh.material = new StandardMaterial("mat", this );
        mesh.alwaysSelectAsActiveMesh = true;
        (mesh.material as StandardMaterial).emissiveColor = Color3.White();
        mesh.visibility = 0;
        this.registerBeforeRender(function () {
            mesh.rotation.y += 0.001;
        });

        //Update SPS mesh
        SPS.initParticles();
        SPS.setParticles();

        let s8 = new SphereEight("test", this )
        s8.applyTextureMaps("assets/scenes/Level_02_Out/star_8k")

        //var gl = new GlowLayer("glow", this);

        //SceneLoader.ImportMesh("", "assets/scenes/Lightmapped/", "level_1.babylon",this,( meshes,p,s,a,atr,ag,al)=>{
        SceneLoader.ImportMesh("", "assets/scenes/Level_02_Out/", "level_02.babylon",this,( meshes,p,s,a,atr,ag,al)=>{

            /* remove any lights */
            for ( let l of al ){ l.dispose(); }

            let totMesh = meshes.length;
            for ( let mIndex = (totMesh-1); mIndex>-1; -- mIndex ){
                let mMat = meshes[ mIndex ];
                console.log( "mesh", mMat.name )
                if ( mMat.material ) {
                    //console.log(mMat.material);
                    //(mMat.material as StandardMaterial).emissiveTexture = (mMat.material as StandardMaterial).diffuseTexture;
                    mMat.checkCollisions = true;
                    mMat.isPickable = true;
                    (mMat.material as StandardMaterial).invertNormalMapY =true
                }
                if( mMat.name.includes("RGET")){
                    //console.log("target")
                    mMat.isPickable = true;
                    TriggerLandingPad.CreateWithMesh( mMat.name, this, (mMat as Mesh) );
                }

                if ( mMat.name === "playerStart"){
                    //camera.position = mMat.position;
                    mMat.setEnabled( false );
                    this._player = new Player( this, mMat.position.clone(), s8 );
                    this._player.createScene_EnableXR( this, sphere );
                }
            }

            //Gravity and Collisions Enabled
            this.gravity = new Vector3(0, -0.5, 0);
            this.collisionsEnabled = true;
            camera.checkCollisions = true;

            //var light = new PointLight("pointLight", new Vector3(0, 100, 0), this);
            //light.intensity = 0.2
            //if ( navigator.hasOwnProperty('xr')){

            //}
            // hide/show the Inspector



        });


        document.defaultView.addEventListener("keydown", (ev) => {
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

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if ( ev.keyCode === 73) {
                this.debugLayer.show();
                if (this.debugLayer.isVisible()) {
                //    this.debugLayer.hide();
                } else {
                    this.debugLayer.show();
                }
            }
        });
    }
}

export { Level };
