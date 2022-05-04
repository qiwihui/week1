const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const { groth16, plonk } = require("snarkjs");

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

describe("HelloWorld", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
    
        // use `fullProve` to create the proof and calculate the witness, 
        // where output `proof` is the proof and output `publicSignals` is the witness
        const { proof, publicSignals } = await groth16.fullProve(
            {"a":"1","b":"2"}, 
            "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm",
            "contracts/circuits/HelloWorld/circuit_final.zkey");

        // print what we are going to proof
        console.log('1x2 =',publicSignals[0]);
        
        // cast string into big int for publicSignals and proof
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        // generate solidity parameters to pass to contract function `verifyProof`
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
        // delete `"[]"` in calldata and then split by `,` and cast into big int for each element
        // so that eacho element is suitable for passing to solidity function `verifyProof`
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
        
        // reconstruct calldata by its elements for a, b, and c
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        // get a shadow copy from the index 8th element of argv into a array, it is the Input to verify the proof
        const Input = argv.slice(8);
        // call verifyProof and check if it returns true
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await groth16.fullProve(
            {"a":"1","b":"2","c":"3"}, 
            "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm",
            "contracts/circuits/Multiplier3/circuit_final.zkey");
        console.log('1x2x3 =',publicSignals[0]);
        
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
        
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("PlonkVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await plonk.fullProve(
            {"a":"1","b":"2","c": "3"}, 
            "contracts/circuits/_plonkMultiplier3/Multiplier3_js/Multiplier3.wasm",
            "contracts/circuits/_plonkMultiplier3/circuit_final.zkey");

        console.log('1x2x3 =',publicSignals[0]);
        
        const calldata = await plonk.exportSolidityCallData(unstringifyBigInts(proof), unstringifyBigInts(publicSignals));
        const calldataSplit = calldata.split(',');
        const proofFormatted = calldataSplit[0];
        const publicSignalsFormatted = JSON.parse(calldataSplit[1]).map(x => BigInt(x).toString());
        expect(await verifier.verifyProof(proofFormatted, publicSignalsFormatted)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        let proof = '0x0c';
        let publicSignals = ["0x0000000000000000000000000000000000000000000000000000000000000000"];
        expect(await verifier.verifyProof(proof, publicSignals)).to.be.false;
    });
});