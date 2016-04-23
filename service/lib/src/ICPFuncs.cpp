#include "ICPFuncs.h"

void icp_compute(double TR[], double TT[], double source[], int sNum, double target[], int tNum, int ctrlNum, double thre, int iter)
{
	ICP icp(source, sNum, target, tNum, ctrlNum, thre, iter);
	icp.run();
	icp.setTR(TR);
	icp.setTT(TT);
}

int getTest(int a, int b) {
	return a + b;
}