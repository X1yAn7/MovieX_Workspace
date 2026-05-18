package com.moviex.common;

public final class LinearAlgebra {

  private LinearAlgebra() {}

  /** 解 A x = b，A 为 n×n，Gauss–Jordan */
  public static double[] linearSolve(double[][] ain, double[] bin) {
    int n = ain.length;
    double[][] a = new double[n][n + 1];
    for (int i = 0; i < n; i++) {
      System.arraycopy(ain[i], 0, a[i], 0, n);
      a[i][n] = bin[i];
    }
    for (int i = 0; i < n; i++) {
      int piv = i;
      for (int r = i; r < n; r++) {
        if (Math.abs(a[r][i]) > Math.abs(a[piv][i])) {
          piv = r;
        }
      }
      double[] tmp = a[i];
      a[i] = a[piv];
      a[piv] = tmp;
      double div = a[i][i];
      if (Math.abs(div) < 1e-14) {
        throw new IllegalStateException("singular matrix");
      }
      for (int j = i; j <= n; j++) {
        a[i][j] /= div;
      }
      for (int r = 0; r < n; r++) {
        if (r == i) continue;
        double f = a[r][i];
        for (int j = i; j <= n; j++) {
          a[r][j] -= f * a[i][j];
        }
      }
    }
    double[] x = new double[n];
    for (int i = 0; i < n; i++) {
      x[i] = a[i][n];
    }
    return x;
  }

  /** 岭回归：β = (X'X + λI)⁻¹ X'y，首列为截距 */
  public static double[] ridgeFit(double[][] xMat, double[] yVec, double lambda) {
    int n = xMat.length;
    int p = xMat[0].length;
    double[][] xtx = new double[p][p];
    double[] xty = new double[p];
    for (int i = 0; i < n; i++) {
      for (int j = 0; j < p; j++) {
        xty[j] += xMat[i][j] * yVec[i];
        for (int k = 0; k < p; k++) {
          xtx[j][k] += xMat[i][j] * xMat[i][k];
        }
      }
    }
    for (int i = 0; i < p; i++) {
      xtx[i][i] += lambda;
    }
    return linearSolve(xtx, xty);
  }

  public static double mean(double[] arr) {
    if (arr.length == 0) return 0;
    double s = 0;
    for (double v : arr) {
      s += v;
    }
    return s / arr.length;
  }

  /** 样本标准差（n−1） */
  public static double stdSample(double[] arr) {
    if (arr.length < 2) return 0;
    double m = mean(arr);
    double v = 0;
    for (double x : arr) {
      v += (x - m) * (x - m);
    }
    v /= arr.length - 1;
    return Math.sqrt(v);
  }
}
