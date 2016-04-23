#include "ICP.h"

#ifdef ICP_DLL_EXPORTS   
#define ICP_DLL_API __declspec(dllexport) 
#else   
#define ICP_DLL_API __declspec(dllimport) 
#endif

#ifdef __cplusplus
extern "C" {
#endif

ICP_DLL_API void icp_compute(double TR[], double TT[], double source[], int sNum, double target[], int tNum, int ctrlNum = 1000, double thre = 0.01, int iter = 10);

ICP_DLL_API int getTest(int a, int b);

#ifdef __cplusplus
}
#endif