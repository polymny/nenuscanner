#!/usr/bin/env python

import json
import functools
import numpy as np
import os
import sys
from PIL import Image

from . import math_utils


# To extract a few images and resize them at 20% of their size:
# for file in ALL/led_00[0-9]0*; do; magick $file -resize 20% SMALL/$(basename $file); done


def print_error(msg: str):
    print('\x1b[1;31m[ERR]' + msg + '\x1b[0m', file=sys.stderr)


def calibrate(input_dir: str):
    # Load all images
    image_names = sorted([
        x for x in os.listdir(input_dir)
        if x != 'calibration.json' and x != 'all_on.jpg' and x != 'all_off.jpg' and x.endswith('.jpg')
    ])
    images = [np.asarray(Image.open(os.path.join(input_dir, x))) for x in image_names]

    # Camera parameters
    nu, nv, nc = images[0].shape
    nspheres = 4
    focal_mm = 35
    matrix_size = 24
    focal_pix = nu * focal_mm / matrix_size
    K = math_utils.build_K_matrix(focal_pix, nu/2, nv/2)

    # Max image: image of brightest pixels, helps spheres segmentation
    max_image = functools.reduce(np.maximum, images)

    # Normalize and reshape the image pixels for Gaussian Mixture Model (GMM) estimation
    pixels = np.reshape(max_image / 255.0, (-1, 3))

    # Initialize parameters for GMM
    # init_params = np.ones(2), np.broadcast_to(np.eye(3) * 0.1, (2, 3, 3)), np.asarray([[0, 0, 0], [1, 1, 1]])

    # Estimate GMM parameters and classify pixels
    # estimated_params = math_utils.gaussian_mixture_estimation(pixels, init_params, it=10)
    # classif = np.asarray(math_utils.maximum_likelihood(pixels, estimated_params), dtype=bool)

    # Refine classification to select the appropriate binary mask
    # rectified_classif = math_utils.select_binary_mask(classif, lambda mask: np.mean(pixels[mask]))
    rectified_classif = np.mean(pixels, axis=-1) > 0.03

    # Identify the largest connected components (spheres) and extract their borders
    sphere_masks = math_utils.get_greatest_components(np.reshape(rectified_classif, (nu, nv)), nspheres)
    border_masks = np.vectorize(math_utils.get_mask_border, signature='(u,v)->(u,v)')(sphere_masks)

    # Fit quadratic forms (ellipses) to the borders
    def fit_on_mask(border):
        return math_utils.fit_quadratic_form(math_utils.to_homogeneous(np.argwhere(border)))

    ellipse_quadratics = np.vectorize(fit_on_mask, signature='(u,v)->(t,t)')(border_masks)

    # Calibrate the ellipses using the camera intrinsic matrix
    calibrated_quadratics = np.swapaxes(K, -1, -2) @ ellipse_quadratics @ K

    # Deproject the ellipse quadratics to sphere centers
    sphere_centers = math_utils.deproject_ellipse_to_sphere(calibrated_quadratics, 1)

    # Create coordinates and calculate camera rays
    coordinates = np.stack(np.meshgrid(range(nu), range(nv), indexing='ij'), axis=-1)
    rays = math_utils.get_camera_rays(coordinates, K)

    # Find the intersections between the camera rays and the spheres
    sphere_points_map, sphere_geometric_masks = \
        math_utils.line_sphere_intersection(sphere_centers[:, np.newaxis, np.newaxis, :], 1, rays[np.newaxis, :, :, :])

    sphere_points = np.asarray([sphere_points_map[i, sphere_geometric_masks[i]] for i in range(nspheres)], dtype=object)
    sphere_normals = np.vectorize(math_utils.sphere_intersection_normal, signature='(v),()->()', otypes=[object])(sphere_centers, sphere_points)

    # Load grey values from images for the identified sphere regions
    def to_grayscale(image):
        return [np.power(np.mean(image, axis=-1)[sphere_geometric_masks[i]] / 255.0, 1.0) for i in range(nspheres)]

    grey_values = np.asarray(list(map(to_grayscale, images)), dtype=object)

    # Estimate lighting conditions from sphere normals and grey values
    estimated_lights = np.vectorize(
        math_utils.estimate_light,
        excluded=(2,),
        signature='(),()->(k)',
        otypes=[float]
    )(sphere_normals, grey_values, (0.1, 0.9))

    # Calculate the positions of the light sources
    light_positions = math_utils.lines_intersections(sphere_centers, estimated_lights)

    # Calculate plane parameters from the sphere centers and intersect camera rays with the plane
    plane_normal, plane_alpha = math_utils.plane_parameters_from_points(sphere_centers)

    # Return value as dictionnary
    return {
        'leds': [{
            'name': name,
            'position': position.tolist(),
            'directions': estimated_lights[i].tolist(),
        } for i, (name, position) in enumerate(zip(image_names, light_positions))],
        'spheres': sphere_centers.tolist(),
        'plane': {
            'normal': plane_normal.tolist(),
            'alpha': plane_alpha.tolist(),
        }
    }


def main():
    if len(sys.argv) < 2:
        print_error('Expected path to images as argument')
        sys.exit(1)

    calib = calibrate(sys.argv[1])

    with open('data/calibration.json', 'w') as f:
        json.dump(calib, f, indent=4)


if __name__ == '__main__':
    main()
