pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib-matrix/circuits/matMul.circom"; // hint: you can use more than one templates in circomlib-matrix to help you

template CalculateTotal(n) {
    signal input nums[n];
    signal output sum;

    signal sums[n];
    sums[0] <== nums[0];

    for (var i=1; i < n; i++) {
        sums[i] <== sums[i - 1] + nums[i];
    }

    sum <== sums[n - 1];
}

template SystemOfEquations(n) { // n is the number of variables in the system of equations
    signal input x[n]; // this is the solution to the system of equations
    signal input A[n][n]; // this is the coefficient matrix
    signal input b[n]; // this are the constants in the system of equations
    signal output out; // 1 for correct solution, 0 for incorrect solution

    // [bonus] insert your code here

    // method 1: algebra
    component mm = matMul(n,n+1,1);
    for(var i = 0; i < n; i++){
        for (var j = 0; j < n; j++){
            // log(A[i][j]);
            mm.a[i][j] <== A[i][j];
        }
        mm.a[i][n] <== -1 * b[i];
        mm.b[i][0] <== x[i];
    }
    mm.b[n][0] <== 1;

    component sum = CalculateTotal(n);
    for (var i = 0; i < n; i++){
        sum.nums[i] <== mm.out[i][0];
    }
    sum.sum === 0;

    // method 2

    // component mm[n];
    // component is_equal[n];
    // component sum = CalculateTotal(n);
    
    // for(var i = 0; i < n; i++){
    //     mm[i] = matMul(1,n,1);
    //     for (var j = 0; j < n; j++){
    //         mm[i].a[0][j] <== A[i][j];
    //         mm[i].b[j][0] <== x[j];
    //     }
    //     is_equal[i] = IsEqual();
    //     is_equal[i].in[0] <== mm[i].out[0][0];
    //     is_equal[i].in[1] <== b[i];
    //     sum.nums[i] <== is_equal[i].out;
    // }
    // sum.sum === n;

}

component main {public [A, b]} = SystemOfEquations(3);
