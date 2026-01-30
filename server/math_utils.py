import numpy as np
import scipy.ndimage as ndimage


def dot_product(v1, v2):
    """Computes the dot product between two arrays of vectors.

    Args:
        v1 (Array ..., ndim): First array of vectors.
        v2 (Array ..., ndim): Second array of vectors.

    Returns:
        Array ...: Dot product between v1 and v2.
    """
    result = np.einsum('...i,...i->...', v1, v2)
    return result


def norm_vector(v):
    """computes the norm and direction of vectors

    Args:
        v (Array ..., dim): vectors to compute the norm and direction for

    Returns:
        Array ...: norms of the vectors
        Array ..., dim: unit direction vectors
    """
    norm = np.linalg.norm(v, axis=-1)
    direction = v/norm[..., np.newaxis]
    return norm, direction


def to_homogeneous(v):
    """converts vectors to homogeneous coordinates

    Args:
        v (Array ..., dim): input vectors

    Returns:
        Array ..., dim+1: homogeneous coordinates of the input vectors
    """
    append_term = np.ones(np.shape(v)[:-1] + (1,))
    homogeneous = np.append(v, append_term, axis=-1)
    return homogeneous


def cross_to_skew_matrix(v):
    """converts a vector cross product to a skew-symmetric matrix multiplication

    Args:
        v (Array ..., 3): vectors to convert

    Returns:
        Array ..., 3, 3: matrices corresponding to the input vectors
    """
    indices = np.asarray([[-1, 2, 1], [2, -1, 0], [1, 0, -1]])
    signs = np.asarray([[0, -1, 1], [1, 0, -1], [-1, 1, 0]])
    skew_matrix = v[..., indices] * signs
    return skew_matrix


def build_K_matrix(focal_length, u0, v0):
    """
    Build the camera intrinsic matrix.

    Parameters:
    focal_length (float): Focal length of the camera.
    u0 (float): First coordinate of the principal point.
    v0 (float): Seccond coordinate of the principal point.

    Returns:
    numpy.ndarray: Camera intrinsic matrix (3x3).
    """
    K = np.asarray([[focal_length, 0, u0],
                    [0, focal_length, v0],
                    [0, 0, 1]])
    return K


def get_camera_rays(points, K):
    """Computes the camera rays for a set of points given the camera matrix K.

    Args:
        points (Array ..., 2): Points in the image plane.
        K (Array 3, 3): Camera intrinsic matrix.

    Returns:
        Array ..., 3: Camera rays corresponding to the input points.
    """
    homogeneous = to_homogeneous(points)
    inv_K = np.linalg.inv(K)
    rays = np.einsum('ij,...j->...i', inv_K, homogeneous)
    return rays


def matrix_kernel(A):
    """Computes the eigenvector corresponding to the smallest eigenvalue of the matrix A.

    Args:
        A (Array ..., n, n): Input square matrix.

    Returns:
        Array ..., n: Eigenvector corresponding to the smallest eigenvalue.
    """
    eigval, eigvec = np.linalg.eig(A)
    min_index = np.argmin(np.abs(eigval), axis=-1)
    min_eigvec = np.take_along_axis(eigvec, min_index[..., None, None], -1)[..., 0]
    normed_eigvec = norm_vector(min_eigvec)[1]
    return normed_eigvec


def evaluate_bilinear_form(Q, left, right):
    """evaluates bilinear forms at several points

    Args:
        Q (Array ...,ldim,rdim): bilinear form to evaluate
        left (Array ...,ldim): points where the bilinear form is evaluated to the left
        right (Array ...,rdim): points where the bilinear form is evaluated to the right
    Returns:
        Array ... bilinear forms evaluated
    """
    result = np.einsum('...ij,...i,...j->...', Q, left, right)
    return result


def evaluate_quadratic_form(Q, points):
    """evaluates quadratic forms at several points

    Args:
        Q (Array ...,dim,dim): quadratic form to evaluate
        points (Array ...,dim): points where the quadratic form is evaluated
    Returns:
        Array ... quadratic forms evaluated
    """
    result = evaluate_bilinear_form(Q, points, points)
    return result


def merge_quadratic_to_homogeneous(Q, b, c):
    """merges quadratic form, linear term, and constant term into a homogeneous matrix

    Args:
        Q (Array ..., dim, dim): quadratic form matrix
        b (Array ..., dim): linear term vector
        c (Array ...): constant term

    Returns:
        Array ..., dim+1, dim+1: homogeneous matrix representing the quadratic form
    """
    dim_points = Q.shape[-1]
    stack_shape = np.broadcast_shapes(np.shape(Q)[:-2], np.shape(b)[:-1], np.shape(c))
    Q_b = np.broadcast_to(Q, stack_shape + (dim_points, dim_points))
    b_b = np.broadcast_to(np.expand_dims(b, -1), stack_shape+(dim_points, 1))
    c_b = np.broadcast_to(np.expand_dims(c, (-1, -2)), stack_shape + (1, 1))
    H = np.block([[Q_b, 0.5 * b_b], [0.5 * np.swapaxes(b_b, -1, -2), c_b]])
    return H


def quadratic_to_dot_product(points):
    """computes the matrix W such that
    x.T@Ax = W(x).T*A[ui,uj]

    Args:
        points ( Array ...,ndim): points of dimension ndim

    Returns:
        Array ...,ni: dot product matrix (W)
        Array ni: i indices of central matrix
        Array ni: j indices of central matrix
    """
    dim_points = points.shape[-1]
    ui, uj = np.triu_indices(dim_points)
    W = points[..., ui] * points[..., uj]
    return W, ui, uj


def fit_quadratic_form(points):
    """Fits a quadratic form to the given zeroes.

    Args:
        points (Array ..., n, dim): Input points.

    Returns:
        Array ..., dim, dim: Fitted quadratic form matrix.
    """
    dim_points = points.shape[-1]
    normed_points = norm_vector(points)[1]
    W, ui, uj = quadratic_to_dot_product(normed_points)
    H = np.einsum('...ki,...kj->...ij', W, W)
    V0 = matrix_kernel(H)
    Q = np.zeros(V0.shape[:-1] + (dim_points, dim_points))
    Q[..., ui, uj] = V0
    return Q


def gaussian_pdf(mu, sigma, x):
    """Computes the PDF of a multivariate Gaussian distribution.

    Args:
        mu (Array ...,k): Mean vector.
        sigma (Array ...,k,k): Covariance matrix.
        x (Array ...,k): Input vector.

    Returns:
        Array ...: Value of the PDF.
    """
    k = np.shape(x)[-1]
    Q = np.linalg.inv(sigma)
    normalization = np.reciprocal(np.sqrt(np.linalg.det(sigma) * np.power(2.0 * np.pi, k)))
    quadratic = evaluate_quadratic_form(Q, x - mu)
    result = np.exp(-0.5 * quadratic) * normalization
    return result


def gaussian_estimation(x, weights):
    """Estimates the mean and covariance matrix of a Gaussian distribution.

    Args:
        x (Array ...,n,dim): Data points.
        weights (Array ...,n): Weights for each data point.

    Returns:
        Array ...,dim: Estimated mean vector.
        Array ...,dim,dim: Estimated covariance matrix.
    """
    weights_sum = np.sum(weights, axis=-1)
    mu = np.sum(x*np.expand_dims(weights, axis=-1), axis=-2) / np.expand_dims(weights_sum, axis=-1)
    centered_x = x - np.expand_dims(mu, axis=-2)
    sigma = np.einsum('...s, ...si, ...sj->...ij', weights, centered_x, centered_x)/np.expand_dims(weights_sum, axis=(-1, -2))
    return mu, sigma


def gaussian_mixture_estimation(x, init_params, it=100):
    """Estimates the parameters of a k Gaussian mixture model using the EM algorithm.

    Args:
        x (Array ..., n, dim): Data points.
        init_params (tuple): Initial parameters (pi, sigma, mu).
            pi (Array ..., k): Initial mixture weights.
            sigma (Array ..., k, dim, dim): Initial covariance matrices.
            mu (Array ..., k, dim): Initial means.
        it (int, optional): Number of iterations. Defaults to 100.

    Returns:
        Tuple[(Array ..., k), (Array ..., k, dim, dim), (Array ..., k, dim)]:
            Estimated mixture weights,covariance matrices, means.
    """
    pi, sigma, mu = init_params
    for _ in range(it):
        pdf = gaussian_pdf(
            np.expand_dims(mu, axis=-2),
            np.expand_dims(sigma, axis=-3),
            np.expand_dims(x, axis=-3)
        ) * np.expand_dims(pi, axis=-1)

        weights = pdf/np.sum(pdf, axis=-2, keepdims=True)
        pi = np.mean(weights, axis=-1)
        mu, sigma = gaussian_estimation(x, weights)
    return pi, sigma, mu


def maximum_likelihood(x, params):
    """Selects the best gaussian model for a point

    Args:
        x (Array ..., dim): Data points.
        params (tuple): Gaussians parameters (pi, sigma, mu).
            pi (Array ..., k): Mixture weights.
            sigma (Array ..., k, dim, dim): Covariance matrices.
            mu (Array ..., k, dim): Means.

    Returns:
        Array ...: integer in [0,k-1] giving the maximum likelihood model
    """
    pi, sigma, mu = params
    pdf = gaussian_pdf(mu, sigma, np.expand_dims(x, axis=-2))*pi
    result = np.argmax(pdf, axis=-1)
    return result


def get_greatest_components(mask, n):
    """
    Extract the n largest connected components from a binary mask.

    Parameters:
        mask (Array ...): The binary mask.
        n (int): The number of largest connected components to extract.

    Returns:
        Array n,...: A boolean array of the n largest connected components
    """
    labeled, _ = ndimage.label(mask)
    unique, counts = np.unique(labeled, return_counts=True)
    greatest_labels = unique[unique != 0][np.argsort(counts[unique != 0])[-n:]]
    greatest_components = labeled[np.newaxis, ...] == np.expand_dims(greatest_labels, axis=tuple(range(1, 1 + mask.ndim)))
    return greatest_components


def get_mask_border(mask):
    """
    Extract the border from a binary mask.

    Parameters:
    mask (Array ...): The binary mask.

    Returns:
    Array ...: A boolean array mask of the border
    """
    inverted_mask = np.logical_not(mask)
    dilated = ndimage.binary_dilation(inverted_mask)
    border = np.logical_and(mask, dilated)
    return border


def select_binary_mask(mask, metric):
    """Selects the side of a binary mask that optimizes the given metric.

    Args:
        mask (Array bool ...): Initial binary mask.
        metric (function): Function to evaluate the quality of the mask.

    Returns:
        Array bool ...: Selected binary mask that maximizes the metric.
    """
    inverted = np.logical_not(mask)
    result = mask if metric(mask) > metric(inverted) else inverted
    return result


def deproject_ellipse_to_sphere(M, radius):
    """finds the deprojection of an ellipse to a sphere

    Args:
        M (Array 3,3): Ellipse quadratic form
        radius (float): radius of the researched sphere

    Returns:
        Array 3: solution of sphere centre location
    """
    H = 0.5 * (np.swapaxes(M, -1, -2) + M)
    eigval, eigvec = np.linalg.eigh(H)
    i_unique = np.argmax(np.abs(np.median(eigval, axis=-1, keepdims=True) - eigval), axis=-1)
    unique_eigval = np.take_along_axis(eigval, i_unique[..., None], -1)[..., 0]
    unique_eigvec = np.take_along_axis(eigvec, i_unique[..., None, None], -1)[..., 0]
    double_eigval = 0.5 * (np.sum(eigval, axis=-1) - unique_eigval)
    z_sign = np.sign(unique_eigvec[..., -1])
    dist = np.sqrt(1 - double_eigval / unique_eigval)
    C = np.real(radius * (dist * z_sign)[..., None] * norm_vector(unique_eigvec)[1])
    return C


def weighted_least_squares(A, y, weights):
    """Computes the weighted least squares solution of Ax=y.

    Args:
        A (Array ...,u,v): Design matrix.
        y (Array ...,u): Target values.
        weights (Array ...,u): Weights for each equation.

    Returns:
        Array ...,v : Weighted least squares solution.
    """
    pinv = np.linalg.pinv(A * weights[..., np.newaxis])
    result = np.einsum('...uv,...v->...u', pinv, y * weights)
    return result


def iteratively_reweighted_least_squares(A, y, epsilon=1e-5, it=20):
    """Computes the iteratively reweighted least squares solution. of Ax=y

    Args:
        A (Array ..., u, v): Design matrix.
        y (Array ..., u): Target values.
        epsilon (float, optional): Small value to avoid division by zero. Defaults to 1e-5.
        it (int, optional): Number of iterations. Defaults to 20.

    Returns:
        Array ..., v: Iteratively reweighted least squares solution.
    """
    weights = np.ones(y.shape)
    for _ in range(it):
        result = weighted_least_squares(A, y, weights)
        ychap = np.einsum('...uv, ...v->...u', A, result)
        delta = np.abs(ychap-y)
        weights = np.reciprocal(np.maximum(epsilon, np.sqrt(delta)))
    return result


def lines_intersections_system(points, directions):
    """computes the system of equations for intersections of lines, Ax=b
    where x is the instersection

    Args:
        points (Array ..., npoints, ndim): points through which the lines pass
        directions (Array ..., npoints, ndim): direction vectors of the lines

    Returns:
        Array ..., 3*npoints, ndim: coefficient matrix A for the system of equations
        Array ..., 3*npoints: right-hand side vector b for the system of equations
    """
    n = norm_vector(directions)[1]
    skew = np.swapaxes(cross_to_skew_matrix(n), -1, -2)
    root = np.einsum('...uij, ...uj->...ui', skew, points)
    A = np.concatenate(np.moveaxis(skew, -3, 0), axis=-2)
    b = np.concatenate(np.moveaxis(root, -2, 0), axis=-1)
    return A, b


def lines_intersections(points, directions):
    """computes the intersections of lines

    Args:
        points (Array ..., npoints, ndim): points through which the lines pass
        directions (Array ..., npoints, ndim): direction vectors of the lines

    Returns:
        Array ..., ndim: intersection
    """
    A, b = lines_intersections_system(points, directions)
    x = iteratively_reweighted_least_squares(A, b)
    return x


def line_sphere_intersection_determinant(center, radius, directions):
    """computes the determinant for the intersection of a line and a sphere,

    Args:
        center (Array ..., dim): center of the sphere
        radius (Array ...): radius of the sphere
        directions (Array ..., dim): direction of the line

    Returns:
        Array ...:intersection determinant
    """
    directions_norm_2 = np.square(norm_vector(directions)[0])
    center_norm_2 = np.square(norm_vector(center)[0])
    dot_product_2 = np.square(dot_product(center, directions))
    delta = dot_product_2 - directions_norm_2 * (center_norm_2 - np.square(radius))
    return delta


def line_plane_intersection(normal, alpha, directions):
    """Computes the intersection points between a line and a plane.

    Args:
        normal (Array ..., ndim): Normal vector to the plane.
        alpha (Array ...): Plane constant alpha.
        directions (Array ..., dim): direction of the line

    Returns:
        Array ..., ndim: Intersection points between the line and the sphere.
    """
    t = -alpha*np.reciprocal(dot_product(directions, normal))
    intersection = directions*t[..., np.newaxis]
    return intersection


def line_sphere_intersection(center, radius, directions):
    """Computes the intersection points between a line and a sphere.

    Args:
        center (Array ..., ndim): Center of the sphere.
        radius (Array ...): Radius of the sphere.
        directions (Array ..., ndim): Direction vectors of the line.

    Returns:
        Array ..., ndim: Intersection points between the line and the sphere.
        Array bool ...: Mask of intersection points
    """
    delta = line_sphere_intersection_determinant(center, radius, directions)
    mask = delta > 0
    directions_norm_2 = np.square(norm_vector(directions)[0])
    distances = (dot_product(center, directions) - np.sqrt(np.maximum(0, delta))) * np.reciprocal(directions_norm_2)
    intersection = np.expand_dims(distances, axis=-1) * directions
    return intersection, mask


def sphere_intersection_normal(center, point):
    """Computes the normal vector at the intersection point on a sphere.

    Args:
        center (Array ..., dim): Coordinates of the sphere center.
        point (Array ..., dim): Coordinates of the intersection point.

    Returns:
        Array ..., dim: Normal normal vector at the intersection point.
    """
    vector = point - center
    normal = norm_vector(vector)[1]
    return normal


def estimate_light(normals, grey_levels, treshold=(0, 1)):
    """Estimates the light directions using the given normals, grey levels, and mask.

    Args:
        normals (Array ..., n, dim): Normal vectors.
        grey_levels (Array ..., n): Grey levels corresponding to the normals.
        threshold (tuple, optional): Intensity threshold for valid grey levels. Defaults to (0, 1).

    Returns:
        Array ..., dim: Estimated light directions.
    """
    validity_mask = np.logical_and(grey_levels > treshold[0], grey_levels < treshold[1])
    lights = weighted_least_squares(normals, grey_levels, validity_mask)
    return lights


def plane_parameters_from_points(points):
    """Computes the parameters of a plane from a set of points.

    Args:
        points (Array ..., dim): Coordinates of the points used to define the plane.

    Returns:
        Array ..., dim: Normal vector to the plane.
        Array ...: Plane constant alpha.
    """
    homogeneous = to_homogeneous(points)
    E = np.einsum('...ki,...kj->...ij', homogeneous, homogeneous)
    L = matrix_kernel(E)
    n, alpha = L[..., :-1], L[..., -1]
    return n, alpha
