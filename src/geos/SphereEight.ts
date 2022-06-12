import {Color3, Mesh, MultiMaterial, MeshBuilder, StandardMaterial, SubMesh, Texture, TransformNode, VertexBuffer, VertexData} from "@babylonjs/core";

class SphereEight extends TransformNode {
    
    sphereMesh:Mesh;
    
    constructor( name, scene ) {
        super( name, scene )

        let  segs = 40
        this.sphereMesh = MeshBuilder.CreateSphere(name, {diameter: 200, segments: segs}, scene);
        this.sphereMesh.flipFaces( true )
        let  mm = new MultiMaterial( name+"-eight_mat",scene)

        let  verticesCount = this.sphereMesh.getTotalVertices();
        this.sphereMesh.subMeshes = [];

        let  indices = this.sphereMesh.getIndices();
        let remapIndies = [[],[],[],[],[],[],[],[]]

        let qCount = ((segs+2)*3)
        let p2 = (qCount*4)*((segs/2)+1)
        for ( let i=0; i<(segs/2)+1;++i){
            for ( let m=0;m<4;++m ){
                new SubMesh(m, 0, verticesCount, (i*(qCount*4))+(m*qCount), qCount , this.sphereMesh);
                remapIndies[m] = remapIndies[m].concat( indices.slice((i*(qCount*4))+(m*qCount),(i*(qCount*4))+(m*qCount)+qCount))
            }
            for ( let m=0;m<4;++m ){
                new SubMesh((m+4), 0, verticesCount, p2+(i*(qCount*4))+(m*qCount), qCount , this.sphereMesh);
                remapIndies[m+4] = remapIndies[m+4].concat( indices.slice(p2+(i*(qCount*4))+(m*qCount),p2+(i*(qCount*4))+(m*qCount)+qCount))
            }
        }
        let remapped= []
        for ( let m=0;m<8;++m ){
            for ( let ii of remapIndies[m] ){
                remapped.push(ii)
            }
        }

        this.sphereMesh.material = mm
        /*
        let  customMesh = new Mesh("custom", scene);
        customMesh.position.z = 2.5;
        customMesh.position.y=1;

        let  positions = this.sphereMesh.getVerticesData(VertexBuffer.PositionKind);
        let  normals = this.sphereMesh.getVerticesData(VertexBuffer.NormalKind);
        let  uvs = this.sphereMesh.getVerticesData(VertexBuffer.UVKind);

        let  vertexData = new VertexData();

        vertexData.positions = positions;
        vertexData.indices = remapped;
        vertexData.normals = normals;
        vertexData.uvs = uvs;
        vertexData.applyToMesh(customMesh);

        for (let m=0;m<8;++m ){
            new SubMesh(m, 0, verticesCount, remapIndies[0].length*m, remapIndies[0].length , customMesh);
        }
        customMesh.subMeshes.shift();

        customMesh.material =mm
        // Move the this.sphereMesh upward 1/2 its height
         */
    }

    applyTextureMaps( textureMapFileName ){

        let voff = [1,1,1,1,2,2,2,2]
        let uoff = [  1, 2, 3, 4, 1,2,3,4]
        let scene = this.getScene();

        textureMapFileName += "_"
        /* define materials for the two this.sphereMeshs */
        for (let i = 0; i < 8; ++i) {
            let submat = new StandardMaterial("s1_mat" + i.toString(),scene);
            submat.emissiveColor = new Color3(1, 0.2, 0.2);
            (this.sphereMesh.material as MultiMaterial).subMaterials.push(submat);

            submat.diffuseTexture = new Texture(textureMapFileName +  (i+1).toString() + ".jpg", scene);
            submat.emissiveTexture = submat.diffuseTexture;

            (submat.diffuseTexture as Texture).vScale = -2.00;
            (submat.diffuseTexture as Texture).uScale = -4.00;
            submat.diffuseTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
            submat.diffuseTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
            (submat.diffuseTexture as Texture).uOffset = uoff[i];
            (submat.diffuseTexture as Texture).vOffset = voff[i];
        }
    }
}

export {SphereEight}
