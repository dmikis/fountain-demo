/**
 * 3D transforms helpers: matrix generators, multiplication, etc.
 * All function return matrices in the column-major order, i.e. in this format:
 *
 *  [
 *      m11, m21, m31, m41,
 *      m12, m22, m32, m42,
 *      m13, m23, m33, m43,
 *      m14, m24, m34, m44
 *  ],
 *
 * where mij - matrix element in the i-th row and j-th column.
 */

define(function () {
    function floatsAreEqual(x, y, accuracy) {
        return Math.abs(x - y) < (accuracy || 1e-15);
    }

    var arraySlice = Array.prototype.slice;

    var transforms = {

        /**
         * Identity transform.
         *
         * @kind constant
         * @type Number[]
         */
        IDENTITY: [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ],

        LEFT_HANDED: 1,
        RIGHT_HANDED: -1,

        /**
         * Rotation about X-axis.
         *
         * @param {Number} angle Angle of rotation.
         * @param {Number} handedness Coordinate system handedness.
         * @returns {Number[]} Rotation matrix in the column-major order.
         */
        rotateX: function (angle, handedness) {
            angle *= (handedness || transforms.RIGHT_HANDED);

            var angleSin = Math.sin(angle);
            var angleCos = Math.cos(angle);

            return [
                1,        0,         0, 0,
                0,  angleCos, angleSin, 0,
                0, -angleSin, angleCos, 0,
                0,        0,         0, 1
            ];
        },

        /**
         * Rotation about Y-axis.
         *
         * @param {Number} angle Angle of rotation.
         * @param {Number} handedness Coordinate system handedness.
         * @returns {Number[]} Rotation matrix in the column-major order.
         */
        rotateY: function (angle, handedness) {
            angle *= (handedness || transforms.RIGHT_HANDED);

            var angleSin = Math.sin(angle);
            var angleCos = Math.cos(angle);

            return [
                 angleCos, 0, angleSin, 0,
                        0, 1,        0, 0,
                -angleSin, 0, angleCos, 0,
                        0, 0,        0, 1
            ];
        },

        /**
         * Rotation about Z-axis.
         *
         * @param {Number} angle Angle of rotation.
         * @returns {Number[]} Rotation matrix in the column-major order.
         */
        rotateZ: function (angle) {
            var angleSin = Math.sin(angle);
            var angleCos = Math.cos(angle);

            return [
                 angleCos, angleSin, 0, 0,
                -angleSin, angleCos, 0, 0,
                        0,        0, 1, 0,
                        0,        0, 0, 1
            ];
        },

        /**
         * Translation by (x, y, z) vector.
         *
         * @param {Number} x x-component of translation vector.
         * @param {Number} y y-component of translation vector.
         * @param {Number} z z-component of translation vector.
         * @returns {Number[]} Translation matrix in the column-major order.
         */
        translate: function (x, y, z) {
            return [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                x, y, z, 1
            ];
        },

        /**
         * Scaling by (x, y, z) factors. If y and z scale factors are omitted then
         * the transform is considered isotropic (with equal factors for every axis).
         *
         * @param {Number} x
         * @param {Number} [y]
         * @param {Number} [z]
         * @returns {Number[]} Scaling matrix in the column-major order.
         */
        scale: function (x, y, z) {
            if (typeof y !== 'number' && typeof z !== 'number') {
                z = y = x;
            }

            return [
                x, 0, 0, 0,
                0, y, 0, 0,
                0, 0, z, 0,
                0, 0, 0, 1
            ];
        },

        /**
         * Calculates perspective projection matrix.
         *
         * @param {Number} fov Vertical field-of-view angle.
         * @param {Number} aspectRatio Screen width to height ratio.
         * @param {Number} zNear Z-coordinate of near clipping plane.
         *      All geometry closer than near plane will be clipped off.
         * @param {Number} zFar Z-coordinate of far clipping plane.
         *      All geometry father than far plane will be clipped off.
         * @returns {Number[]} Projection matrix in the column-major order.
         *      Notice that after applying the matrix to a vector it
         *      should be normalized, i.e. all its components should be
         *      divided by `w` component.
         */
        perspective: function (fov, aspectRatio, zNear, zFar) {
            var f = 1 / Math.tan(0.5 * fov);

            var m11 = f / aspectRatio;
            var m33 = (zNear + zFar) / (zNear - zFar);
            var m34 = 2 * zNear * zFar / (zNear - zFar);

            return [
                m11,   0,   0,  0,
                  0,   f,   0,  0,
                  0,   0, m33, -1,
                  0,   0, m34,  0
            ];
        },

        /**
         * Calculates orthographic projection matrix. If near and far clipping
         * planes are not specified, transformation will keep the Z coordinate
         * unaltered.
         *
         * @param {Number} aspectRatio Screen width to height ratio.
         * @param {Number} [zNear] Z-coordinate of near clipping plane.
         *      All geometry closer than near plane will be clipped off.
         * @param {Number} [zFar] Z-coordinate of far clipping plane.
         *      All geometry father than far plane will be clipped off.
         * @returns {Number[]} Projection matrix in the column-major order.
         */
        orthographic: function (aspectRatio, zNear, zFar) {
            var clippingPlanesSpecified = (typeof zNear === 'number') && (typeof zFar === 'number');
            var m11 = 1 / aspectRatio;
            var m33 = clippingPlanesSpecified ? 2 / (zNear - zFar) : 1;
            var m34 = clippingPlanesSpecified ? (zNear + zFar) / (zNear - zFar) : 0;

            return [
                m11,   0,   0,   0,
                  0,   1,   0,   0,
                  0,   0, m33,   0,
                  0,   0, m34,   1
            ];
        },

        /**
         * Multiply several matrices.
         *
         * @param {...Number[]} matrix 4x4 matrix.
         * @returns {Number[]} Result of multiplication.
         */
        multiplyMatrices: function () {
            var args = arraySlice.call(arguments);
            var currentMatrix = args.pop();
            var matrix1, matrix2;
            var currentElement;

            while (args.length) {
                matrix1 = args.pop();
                matrix2 = currentMatrix;
                currentMatrix = new Array(16);

                for (var i = 0; i !== 4; ++i) {
                    for (var j = 0; j !== 4; ++j) {
                        currentElement = 0;
                        for (var k = 0; k !== 4; ++k) {
                            currentElement += matrix1[4 * k + i] * matrix2[4 * j + k];
                        }
                        currentMatrix[4 * j + i] = currentElement;
                    }
                }

            }

            return currentMatrix;
        },

        /**
         * Transform vertices by matrix.
         *
         * @param {Number[]} matrix 4x4 tranform matrix.
         * @param {Number[]} sourceVertices Plain array of 4d vertices transform
         *      matrix will be applied to.
         * @param {Number[]} destVertices Plain array where transformed vertices
         *      will be stored. Note, that it's guaranteed to perform properly when
         *      `destVertices` and `sourceVertices` are the very same array.
         */
        applyToVertices: function (matrix, sourceVertices, destVertices) {
            var m11 = matrix[0];
            var m21 = matrix[1];
            var m31 = matrix[2];
            var m41 = matrix[3];

            var m12 = matrix[4];
            var m22 = matrix[5];
            var m32 = matrix[6];
            var m42 = matrix[7];

            var m13 = matrix[8];
            var m23 = matrix[9];
            var m33 = matrix[10];
            var m43 = matrix[11];

            var m14 = matrix[12];
            var m24 = matrix[13];
            var m34 = matrix[14];
            var m44 = matrix[15];

            var sx, sy, sz, sw;

            for (var i = 0, il = sourceVertices.length; i !== il; i += 4) {
                sx = sourceVertices[i];
                sy = sourceVertices[i + 1];
                sz = sourceVertices[i + 2];
                sw = sourceVertices[i + 3];

                destVertices[i]     = m11 * sx + m12 * sy + m13 * sz + m14 * sw;
                destVertices[i + 1] = m21 * sx + m22 * sy + m23 * sz + m24 * sw;
                destVertices[i + 2] = m31 * sx + m32 * sy + m33 * sz + m34 * sw;
                destVertices[i + 3] = m41 * sx + m42 * sy + m43 * sz + m44 * sw;
            }
        },

        /**
         * Normalize vertices coordinates, i.e. divide x, y, and z coordinates
         * of each vertex by its w coordinate.
         *
         * @param {Number[]} vertices Plain array of vertices to be normalized.
         */
        normalizeVertices: function (vertices) {
            for (var i = 0, l = vertices.length; i < l; i += 4) {
                var w = vertices[i + 3];

                vertices[i]     /= w;
                vertices[i + 1] /= w;
                vertices[i + 2] /= w;
                vertices[i + 3] = 1;
            }
        },

        /**
         * Compare tranformations as matrices.
         *
         * @param {Number[]} m1 Matrix of first transform.
         * @param {Number[]} m2 Matrix of second transform.
         * @param {Number} [e = math.FLOAT_ACCURACY] Comparison accuracy.
         * @returns {Boolean} `true` if difference between corresponding
         *      elements of `m1` and `m2` is within `e`.
         */
        areEqual: function (m1, m2, e) {
            for (var i = 0, l = m1.length; i !== l; ++i) {
                if (!floatsAreEqual(m1[i], m2[i], e)) {
                    return false;
                }
            }

            return true;
        },

        /**
         * Transposes 4x4 matrix.
         * @see http://en.wikipedia.org/wiki/Transpose
         *
         * @param {Number[]} m Matrix to be transposed.
         * @returns {Number[]} Transposed matrix.
         */
        transpose: function (m) {
            return [
                m[0], m[4], m[8],  m[12],
                m[1], m[5], m[9],  m[13],
                m[2], m[6], m[10], m[14],
                m[3], m[7], m[11], m[15]
            ];
        }
    };

    return transforms;
});
