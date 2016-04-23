#ifndef ICP_H_
#define ICP_H_

#include <vector>
#include <string>
#include "matrix.h"
#include "kdtree.h"

using namespace std;

class ICP
{
public:
	ICP(double *source, int sNum, double* target, int tNum, int ctrlNum = 1000, double thre = 0.01, int iter = 10);
	ICP(int ctrlNum = 1000, double thre = 0.01, int iter = 10);
	~ICP();
	void readfile(string firstname, string secondname);
	void run();
	void writefile(string name);

	void setTR(double* TR);
	void setTT(double* TT);

	double* getTR();
	double* getTT();

private:
	void sample(); //sample control points
	double closest(); // find corresponding points and return error
	double closestByKdTree(); 
	void center(); //get center from two control points
	void rmcenter(); //remove center from two control points
	void transform(); //get transform (rotate) matrix
	void updata();  // update control points coordinate
	void applyall();

private:
	double distance(Vertex a, Vertex b);

private:

	KDTree kdTree;

	int ctrlNum; // control points number
	int iterate; //iterate number
	double threshold; //stop threshold

	vector<Vertex> VarrP; //original points
	vector<Vertex> VarrQ;

	Vertex meanP; // control points center
	Vertex meanQ;
	Vertex *contP; //control points in P
	Vertex *contQ;
	Vertex *rmcoP; //control points after removing center
	Vertex *rmcoQ;

	int *index;	//use when sampling control points and in finding corresponding points index

	Matrix TR;
	Matrix TT;

	Matrix Rw;
	Matrix Tw;


};

#endif /* ICP_H_ */
