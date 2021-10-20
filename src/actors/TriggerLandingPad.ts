import {Color3, Mesh, MeshBuilder, Nullable, PointLight, Scene, Sound, StandardMaterial, TransformNode, Vector3} from "@babylonjs/core";

class TriggerLandingPad extends TransformNode{

    public playerVisited:boolean = false;
    private sound:Sound;
    private mesh:Mesh;

    constructor( name: string, scene: Nullable<Scene> = null, newMesh:Mesh ){
        super( name, scene );

        this.mesh = newMesh;
        this.position = newMesh.position.clone();
        newMesh.setParent( this );
        newMesh.position = new Vector3(0,0,0);

        this.sound = new Sound("Gunshot", "assets/sounds/gong.mp3", scene, null, {
            volume: 0.5,
            autoplay:false,
            loop:false
        });
    }

    public setTrue(){
        ( this.mesh.material as StandardMaterial ).diffuseColor = new Color3( 0.8,0.8,0.8 );
        ( this.mesh.material as StandardMaterial ).emissiveColor = (  this.mesh.material as StandardMaterial ).diffuseColor;
        //gsap.to( (this.mesh.material as StandardMaterial ).diffuseColor, { duration: 1, r: 1.0, b:1.0, g:1.0 } );
        this.sound.play()
        this.playerVisited = true;

    }

    public static CreateWithMesh( name:string, scene:Scene, newMesh:Mesh ) : TriggerLandingPad {

        //const l1 = new PointLight("pointLight", new Vector3(0,5,0), scene);
        //l1.diffuse = new Color3( Math.random(),Math.random(),Math.random());
        //l1.parent = newMesh;

        ( newMesh as Mesh ).material = new StandardMaterial( name + "mat", scene );
        (  newMesh.material as StandardMaterial ).diffuseColor = new Color3( 0.0,0.4,0.4 );
        (  newMesh.material as StandardMaterial ).emissiveColor = (  newMesh.material as StandardMaterial ).diffuseColor

        return ( new TriggerLandingPad( "TLP_" + name, scene, newMesh ) );
    }

    public static CreateBox( name:string,scene:Scene) : TriggerLandingPad {

        const m1 = MeshBuilder.CreateBox("box", {size: 1}, scene);
        (  m1.material as StandardMaterial ).diffuseColor = new Color3( Math.random(),Math.random(),Math.random());

        const l1 = new PointLight("pointLight", new Vector3(0,5,0), scene);
        l1.diffuse = (  m1.material as StandardMaterial ).diffuseColor;
        l1.parent = m1;

        return ( new TriggerLandingPad( name,scene,m1) );
    }
}

export { TriggerLandingPad }
