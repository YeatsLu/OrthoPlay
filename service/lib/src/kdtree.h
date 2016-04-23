#ifndef KDTREE_H_H
#define KDTREE_H_H

#include <vector>
#include "kdtreenode.h"

class KDTree	
{
public:
	KDTreeNode *root;		
public:
	KDTree() :root(NULL){}
	void create(const std::vector<Vertex> &vertex_set);		
	void destroy();								
	~KDTree(){ destroyKDTree(root); }
	std::pair<Vertex, double> findNearest(Vertex target);

private:
	KDTreeNode* createKDTree(const std::vector<Vertex> &vertex_set);
	void destroyKDTree(KDTreeNode *root);
	std::pair<Vertex, double> findNearest_i(KDTreeNode *root, Vertex target);
};

class NodeCompare
{
private:
	int dim;
public:
	NodeCompare(const int dim) :dim(dim){}
	bool operator() (const Vertex& x, const Vertex& y) const
	{
		return x.coord[dim] < y.coord[dim];
	}
};

#endif