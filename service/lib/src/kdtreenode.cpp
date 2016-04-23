#include <algorithm>
#include <cmath>
#include "kdtreenode.h"
void KDTreeNode::create(KDTreeNode *left, KDTreeNode *right, KDTreeNode *parent, int dim, Vertex vertex)
{
	this->left = left;
	this->right = right;
	this->parent = parent;
	this->dim = dim;
	this->vertex = vertex;
}

KDTreeNode::KDTreeNode(const KDTreeNode& node)
{
	this->left = node.left;
	this->right = node.right;
	this->parent = node.parent;
	this->dim = node.dim;
	this->vertex = node.vertex;
}

KDTreeNode& KDTreeNode::operator =(const KDTreeNode &node)
{
	if (this == &node) {
		return *this;
	}
	this->left = node.left;
	this->right = node.right;
	this->parent = node.parent;
	this->dim = node.dim;
	this->vertex = node.vertex;
	return *this;
}

double DistanceNode(const Vertex &a, const Vertex &b) {
	double dis = 0;
	for (int i = 0; i < DIM; i++) {
		dis += (a.coord[i] - b.coord[i]) * 
			(a.coord[i] - b.coord[i]);
	}
	dis = sqrt(dis);
	return dis;
}
