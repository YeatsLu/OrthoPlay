#include <iostream>
#include <fstream>
#include <sstream>
#include <math.h>
#include <time.h>
#include "ICP.h"

using namespace std;

ICP::ICP(double *source, int sNum, double* target, int tNum, int ctrlNum, double thre, int iter)
: ctrlNum(ctrlNum), threshold(thre), iterate(iter)
{
	int k = 0;
	for (int i = 0; i < sNum; i++) {
		Vertex v;
		for (int j = 0; j < 3; j++) {
			v.coord[j] = source[k++];
		}
		VarrP.push_back(v);
	}

	k = 0;
	for (int i = 0; i < tNum; i++) {
		Vertex v;
		for (int j = 0; j < 3; j++) {
			v.coord[j] = target[k++];
		}
		VarrQ.push_back(v);
	}

	contP = new Vertex[ctrlNum];
	contQ = new Vertex[ctrlNum];
	rmcoP = new Vertex[ctrlNum];
	rmcoQ = new Vertex[ctrlNum];
	index = new int[ctrlNum];

	TR = Matrix::eye(3);
	TT = Matrix(3, 1);
	for (int i = 0; i < 3; i++) {
		TT.val[i][0] = 0;
	}

	kdTree.create(VarrQ);
}

ICP::ICP(int ctrlNum, double thre, int iter) 
: ctrlNum(ctrlNum), threshold(thre), iterate(iter)
{
	contP = new Vertex[ctrlNum];
	contQ = new Vertex[ctrlNum];
	rmcoP = new Vertex[ctrlNum];
	rmcoQ = new Vertex[ctrlNum];
	index = new int[ctrlNum];

	TR = Matrix::eye(3);
	TT = Matrix(3, 1);
	for (int i = 0; i < 3; i++) {
		TT.val[i][0] = 0;
	}
}

ICP::~ICP()
{
	delete[] contP;
	delete[] contQ;
	delete[] rmcoP;
	delete[] rmcoQ;
	delete[] index;
}

void ICP::readfile(string firstname, string secondname)
{
	cout << "read two clouds of points from obj files" << endl;
	char buf[1024];
	ifstream inobj;

	inobj.open(firstname.c_str());
	while (inobj.getline(buf, sizeof(buf)))
	{
		string s = buf;
		if (s.find_first_of("v") == 0)
		{
			istringstream is(s);
			string title;
			Vertex v;
			is >> title >> v.coord[0] >> v.coord[1] >> v.coord[2];
			VarrP.push_back(v);
		}
	}
	inobj.close();
	//
	inobj.open(secondname.c_str());
	while (inobj.getline(buf, sizeof(buf)))
	{
		string s = buf;
		if (s.find_first_of("v") == 0)
		{
			istringstream is(s);
			string title;
			Vertex v;
			is >> title >> v.coord[0] >> v.coord[1] >> v.coord[2];
			VarrQ.push_back(v);
		}
	}
	inobj.close();

	kdTree.create(VarrQ);
}

void ICP::run()
{
	sample();

	double err = closestByKdTree();

	//cout << "initial error = " << err << endl;

	for (int i = 0; i < iterate; i++)
	{
		center();
		rmcenter();
		transform();
		updata();

		double newerr = closestByKdTree();

		//cout << "iterate times = " << i << endl;
		//cout << "error = " << newerr << endl;
		double delta = fabs(err - newerr) / ctrlNum;
		//cout << "delta = " << delta << endl;
		if (delta < threshold)
			break;
		err = newerr;
	}

	//cout << TR;
	//cout << TT;

	//applyall();

}

void ICP::setTR(double* TR) {
	for (int i = 0; i < 9; i++) {
		*TR++ = this->TR.val[0][i];
	}
}

void ICP::setTT(double* TT) {
	for (int i = 0; i < 3; i++) {
		*TT++ = this->TT.val[0][i];
	}
}

double* ICP::getTR() {
	return TR.val[0];
}

double* ICP::getTT() {
	return TT.val[0];
}

void ICP::writefile(string name)
{
	cout << "output clouds of points P after transform" << endl;
	//
	ofstream outobj;
	outobj.open(name.c_str());
	outobj << "# Geomagic Studio" << endl;
	int num = 1;
	for (vector<Vertex>::const_iterator p = VarrP.begin(); p != VarrP.end(); p++)
	{
		Vertex v;
		v = *p;
		outobj << "v " << v.coord[0] << " " << v.coord[1] << " " << v.coord[2] << endl;
		outobj << "p " << num++ << endl;
	}
	//
	outobj.close();
}

void ICP::sample()
{
	int pN = VarrP.size();
	bool *flag = new bool[pN];
	for (int i = 0; i < pN; i++)
		flag[i] = false;
	srand((unsigned)time(NULL));
	for (int i = 0; i < ctrlNum; i++)
	{
		while (true)
		{
			int sam = rand() % pN;
			if (!flag[sam])
			{
				index[i] = sam;
				flag[sam] = true;
				break;
			}
		}
	}
	for (int i = 0; i < ctrlNum; i++)
	{
		Vertex v = VarrP[index[i]];
		for (int j = 0; j < 3; j++)
		{
			contP[i].coord[j] = v.coord[j];
		}
	}

	delete[] flag;
}

void ICP::center()
{
	for (int i = 0; i < 3; i++)
		meanP.coord[i] = 0.0;
	for (int i = 0; i < ctrlNum; i++)
	{
		for (int j = 0; j < 3; j++)
			meanP.coord[j] += contP[i].coord[j];
	}
	for (int i = 0; i < 3; i++)
		meanP.coord[i] = meanP.coord[i] / ctrlNum;

	for (int i = 0; i < 3; i++)
		meanQ.coord[i] = 0.0;
	for (int i = 0; i < ctrlNum; i++)
	{
		for (int j = 0; j < 3; j++)
			meanQ.coord[j] += contQ[i].coord[j];
	}
	for (int i = 0; i < 3; i++)
		meanQ.coord[i] = meanQ.coord[i] / ctrlNum;
}

void ICP::rmcenter()
{
	//
	for (int i = 0; i < ctrlNum; i++)
	{
		for (int j = 0; j < 3; j++)
		{
			rmcoP[i].coord[j] = contP[i].coord[j] - meanP.coord[j];
		}
	}
	//
	for (int i = 0; i < ctrlNum; i++)
	{
		for (int j = 0; j < 3; j++)
		{
			rmcoQ[i].coord[j] = contQ[i].coord[j] - meanQ.coord[j];
		}
	}
}

double ICP::closest()
{
	double error = 0.0;
	for (int i = 0; i < ctrlNum; i++)
	{
		double maxdist = 100.0;
		index[i] = 0;
		for (unsigned int j = 0; j < VarrQ.size(); j++)
		{
			double dist = distance(contP[i], VarrQ[j]);
			if (dist < maxdist)
			{
				maxdist = dist;
				index[i] = j;
			}
		}
		Vertex v = VarrQ[index[i]];
		for (int j = 0; j < 3; j++)
		{
			contQ[i].coord[j] = v.coord[j];
		}
		error += maxdist;
	}
	return error;
}

double ICP::closestByKdTree() {
	double error = 0.0;
	for (int i = 0; i < ctrlNum; i++)
	{
		std::pair<Vertex, double> result = kdTree.findNearest(contP[i]);

		for (int j = 0; j < 3; j++)
		{
			contQ[i].coord[j] = result.first.coord[j];
		}
		error += result.second;
	}
	return error;
}


void ICP::transform()
{
	//cout << "get transform matrix" << endl;

	Matrix mu_t(1, 3);
	Matrix mu_m(1, 3);
	for (int i = 0; i < 3; i++) {
		mu_t.val[0][i] = meanP.coord[i];
		mu_m.val[0][i] = meanQ.coord[i];
	}

	Matrix q_t(ctrlNum, 3);
	Matrix q_m(ctrlNum, 3);
	for (int i = 0; i < ctrlNum; i++) {
		for (int j = 0; j < 3; j++) {
			q_t.val[i][j] = rmcoP[i].coord[j];
			q_m.val[i][j] = rmcoQ[i].coord[j];
		}
	}

	Matrix H = ~q_t*q_m;
	Matrix U, W, V;
	H.svd(U, W, V);
	Rw = V*~U;

	// fix improper matrix problem
	if (Rw.det() < 0){
		Matrix B = Matrix::eye(3);
		B.val[2][2] = Rw.det();
		Rw = V*B*~U;
	}

	Tw = ~mu_m - Rw*~mu_t;

	// compose: R|t = R_|t_ * R|t
	TR = Rw*TR;
	TT = Rw*TT + Tw;

	//cout << "current R & T" << endl;
	//cout << TR;
	//cout << TT;

}

void ICP::updata()
{
	//cout<<"update control points in P"<<endl;
	//
	//rotate + translate
	for (int i = 0; i < ctrlNum; i++)
	{
		double tmp[3] = { 0, 0, 0 };
		for (int j = 0; j < 3; j++)
		{
			for (int k = 0; k < 3; k++)
			{
				tmp[j] += Rw.val[j][k] * contP[i].coord[k];
			}
		}
		for (int j = 0; j < 3; j++)
			contP[i].coord[j] = tmp[j] + Tw.val[j][0];

	}
}

void ICP::applyall()
{
	cout << "transform to all data in P" << endl;
	// make rotate
	for (vector<Vertex>::iterator p = VarrP.begin(); p != VarrP.end(); p++)
	{
		Vertex v = *p;
		double tmp[3] = { 0, 0, 0 };
		for (int i = 0; i < 3; i++)
		{
			for (int k = 0; k < 3; k++)
			{
				tmp[i] += TR.val[i][k] * v.coord[k];
			}
		}
		for (int i = 0; i < 3; i++)
		{
			v.coord[i] = tmp[i] + TT.val[i][0];
		}
		*p = v;
	}
	//
}

double ICP::distance(Vertex a, Vertex b)
{
	double dist = 0.0;
	for (int i = 0; i < 3; i++)
	{
		dist += (a.coord[i] - b.coord[i])*(a.coord[i] - b.coord[i]);
	}
	return dist;
}
